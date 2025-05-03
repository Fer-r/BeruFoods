<?php

namespace App\Controller;

use App\Entity\Article;
use App\Entity\Restaurant;
use App\Repository\ArticleRepository;
use App\Repository\RestaurantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

#[Route('/api/articles')] // Base route for articles
final class ArticleController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10; // Define items per page

    public function __construct(
        private ParameterBagInterface $params,
        private SluggerInterface $slugger,
        private Filesystem $filesystem
    ) {}

    #[Route('', name: 'api_article_index', methods: ['GET'])]
    public function index(ArticleRepository $articleRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

        $restaurantId = $request->query->get('restaurantId');
        $available = $request->query->get('available');

        $qb = $articleRepository->createQueryBuilder('a');

        if ($restaurantId) {
            $qb->andWhere('a.restaurant = :restaurantId')
               ->setParameter('restaurantId', $restaurantId);
        }
        if ($available !== null) {
            $qb->andWhere('a.available = :available')
               ->setParameter('available', filter_var($available, FILTER_VALIDATE_BOOLEAN));
        }

        // Apply pagination
        $qb->orderBy('a.name', 'ASC') // Example order
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $paginator = new Paginator($qb->getQuery(), true);
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);

        $results = iterator_to_array($paginator->getIterator());

        // Get base path for images
        $imageBasePath = $this->params->get('article_images_public_path');

        // Add imageUrl to each result
        $processedResults = [];
        foreach ($results as $article) {
            // Serialize individual article
            $articleData = json_decode($serializer->serialize($article, 'json', ['groups' => 'article:read:collection']), true);
            // Add imageUrl
            $filename = $article->getImageFilename();
            $articleData['imageUrl'] = $filename ? rtrim($imageBasePath, '/') . '/' . $filename : null;
            $processedResults[] = $articleData;
        }

        $data = [
            'items' => $processedResults, // Use processed results
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        // Serialize the final data structure
        $json = json_encode($data); // Data is already structured
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_article_show', methods: ['GET'])]
    public function show(Article $article, SerializerInterface $serializer): JsonResponse
    {
        // Serialize the article object
        $json = $serializer->serialize($article, 'json', ['groups' => 'article:read']);

        // Decode the JSON to an array to add the image URL
        $data = json_decode($json, true);

        // Get base path for images
        $imageBasePath = $this->params->get('article_images_public_path');

        // Construct and add the image URL
        $filename = $article->getImageFilename();
        $data['imageUrl'] = $filename ? rtrim($imageBasePath, '/') . '/' . $filename : null;

        // Return the modified data as JSON
        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('', name: 'api_article_create', methods: ['POST'])]
    #[IsGranted('ROLE_RESTAURANT')] // Or ROLE_ADMIN - handled below
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository
    ): JsonResponse {
        $article = $serializer->deserialize($request->getContent(), Article::class, 'json', [
            // Ignore imageFilename during initial deserialization, handle separately
            AbstractNormalizer::IGNORED_ATTRIBUTES => ['imageFilename']
        ]);

        $loggedInUser = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if ($loggedInUser instanceof Restaurant) {
            // If logged-in user is a restaurant, assign it automatically
            $article->setRestaurant($loggedInUser);
        } elseif ($this->isGranted('ROLE_ADMIN') && isset($data['restaurantId'])) {
            // If admin, require restaurantId in payload
            $restaurant = $restaurantRepository->find($data['restaurantId']);
            if (!$restaurant) {
                return $this->json(['message' => 'Restaurant not found for the provided ID'], Response::HTTP_BAD_REQUEST);
            }
            $article->setRestaurant($restaurant);
        } else {
            // Deny if not a restaurant owner or admin providing ID
            return $this->json(['message' => 'Cannot determine article restaurant owner.'], Response::HTTP_FORBIDDEN);
        }

        // Handle Image Upload
        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile'); // Key used in FormData
        if ($imageFile) {
            $uploadDirectory = $this->params->get('article_images_directory');
            // Basic validation (adjust as needed)
            if (!in_array($imageFile->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
                return $this->json(['errors' => ['imageFile' => 'Invalid file type. Only JPG, PNG, GIF allowed.']], Response::HTTP_BAD_REQUEST);
            }
            if ($imageFile->getSize() > 2 * 1024 * 1024) { // 2MB limit example
                return $this->json(['errors' => ['imageFile' => 'File is too large. Max 2MB allowed.']], Response::HTTP_BAD_REQUEST);
            }

            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename.'-'.uniqid().'.'.$imageFile->guessExtension();

            try {
                // Move the file to the target directory
                $imageFile->move($uploadDirectory, $newFilename);
                $article->setImageFilename($newFilename); // Set filename on entity
            } catch (FileException $e) {
                return $this->json(['errors' => ['imageFile' => 'Failed to upload image: '.$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        } // No file uploaded is ok for create

        $errors = $validator->validate($article);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

            $entityManager->persist($article);
            $entityManager->flush();

        // Return created article data or just the ID
        $json = $serializer->serialize($article, 'json', ['groups' => 'article:read']);
        // Add imageUrl
        $data = json_decode($json, true);
        $imageBasePath = $this->params->get('article_images_public_path');
        $filename = $article->getImageFilename();
        $data['imageUrl'] = $filename ? rtrim($imageBasePath, '/') . '/' . $filename : null;

        return new JsonResponse($data, Response::HTTP_CREATED); // Already an array
    }

    #[Route('/{id}', name: 'api_article_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('edit', 'article')] // Assumes ArticleVoter for ownership check
    public function update(
        Request $request,
        Article $article, // The existing article fetched via param converter
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted('edit', $article); // Check ownership (article->getRestaurant() == user) or ROLE_ADMIN via Voter

        // Keep original restaurant, should not be changed on update via this method
        $originalRestaurant = $article->getRestaurant();

        $serializer->deserialize($request->getContent(), Article::class, 'json', [
            AbstractNormalizer::OBJECT_TO_POPULATE => $article,
            AbstractNormalizer::IGNORED_ATTRIBUTES => ['restaurant', 'imageFilename'] // Ignore imageFilename
        ]);

        // Ensure restaurant wasn't changed by deserialization ( belt & suspenders)
        $article->setRestaurant($originalRestaurant);

        // Handle Image Upload on Update
        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile');
        if ($imageFile) {
            $uploadDirectory = $this->params->get('article_images_directory');
            // Validation (same as create)
            if (!in_array($imageFile->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
                return $this->json(['errors' => ['imageFile' => 'Invalid file type. Only JPG, PNG, GIF allowed.']], Response::HTTP_BAD_REQUEST);
            }
            if ($imageFile->getSize() > 2 * 1024 * 1024) { // 2MB limit example
                return $this->json(['errors' => ['imageFile' => 'File is too large. Max 2MB allowed.']], Response::HTTP_BAD_REQUEST);
            }

            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $newFilename = $safeFilename.'-'.uniqid().'.'.$imageFile->guessExtension();

            try {
                // Get old filename BEFORE setting the new one
                $oldFilename = $article->getImageFilename();

                // Move the new file
                $imageFile->move($uploadDirectory, $newFilename);
                $article->setImageFilename($newFilename); // Update entity with new filename

                // Delete old file AFTER successful move and entity update
                if ($oldFilename) {
                    $this->filesystem->remove($uploadDirectory.'/'.$oldFilename);
                }
            } catch (FileException $e) {
                return $this->json(['errors' => ['imageFile' => 'Failed to upload image: '.$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        $errors = $validator->validate($article);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}', name: 'api_article_delete', methods: ['DELETE'])]
    #[IsGranted('delete', 'article')] // Assumes ArticleVoter for ownership check
    public function delete(Article $article, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('delete', $article); // Check ownership or ROLE_ADMIN via Voter

            $entityManager->remove($article);
            $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
