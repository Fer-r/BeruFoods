<?php

namespace App\Controller;

use App\Entity\Article;
use App\Entity\Restaurant;
use App\Repository\ArticleRepository;
use App\Repository\RestaurantRepository;
use App\Service\ImageUploader;
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
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\Validator\ConstraintViolationListInterface;

#[Route('/api/articles')] // Base route for articles
final class ArticleController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10; 

    public function __construct(
        private ImageUploader $imageUploader
    ) {}

    #[Route('', name: 'api_article_index', methods: ['GET'])]
    public function index(ArticleRepository $articleRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

        if ($limit < 1) {
            $limit = self::ITEMS_PER_PAGE;
        }

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

        $qb->orderBy('a.name', 'ASC')
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $paginator = new Paginator($qb->getQuery(), true);
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);

        $results = iterator_to_array($paginator->getIterator());

        $processedResults = [];
        foreach ($results as $article) {
            $articleData = json_decode($serializer->serialize($article, 'json', ['groups' => 'article:read:collection']), true);
            if ($articleData === null) {
                return new JsonResponse(['message' => 'Error processing article data.'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            $articleData['imageUrl'] = $this->imageUploader->getImageUrl($article->getImageFilename());
            $processedResults[] = $articleData;
        }

        $data = [
            'items' => $processedResults,
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        return new JsonResponse($data, Response::HTTP_OK); // Data is already an array structure
    }

    #[Route('/{id}', name: 'api_article_show', methods: ['GET'])]
    public function show(Article $article, SerializerInterface $serializer): JsonResponse
    {
        $data = json_decode($serializer->serialize($article, 'json', ['groups' => 'article:read']), true);
        if ($data === null) {
            return new JsonResponse(['message' => 'Error processing article data.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        $data['imageUrl'] = $this->imageUploader->getImageUrl($article->getImageFilename());

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('', name: 'api_article_create', methods: ['POST'])]
    #[IsGranted('ROLE_RESTAURANT')]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository
    ): JsonResponse {
        $data = $request->request->all();
        $article = $serializer->deserialize(json_encode($data), Article::class, 'json', [
            AbstractNormalizer::IGNORED_ATTRIBUTES => ['imageFilename']
        ]);

        $loggedInUser = $this->getUser();

        if ($loggedInUser instanceof Restaurant) {
            $article->setRestaurant($loggedInUser);
        } elseif ($this->isGranted('ROLE_ADMIN') && isset($data['restaurantId'])) {
            $restaurant = $restaurantRepository->find($data['restaurantId']);
            if (!$restaurant) {
                return $this->json(['message' => 'Restaurant not found for the provided ID'], Response::HTTP_BAD_REQUEST);
            }
            $article->setRestaurant($restaurant);
        } else {
            return $this->json(['message' => 'Cannot determine article restaurant owner.'], Response::HTTP_FORBIDDEN);
        }

        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile');
        if ($imageFile) {
            try {
                $newFilename = $this->imageUploader->uploadImage($imageFile);
                $article->setImageFilename($newFilename);
            } catch (FileException $e) {
                return $this->json(['errors' => ['imageFile' => $e->getMessage()]], Response::HTTP_BAD_REQUEST);
            }
        }

        $errors = $validator->validate($article);
        if (count($errors) > 0) {
            return $this->formatValidationErrors($errors);
        }

        $entityManager->persist($article);
        $entityManager->flush();

        $articleData = json_decode($serializer->serialize($article, 'json', ['groups' => 'article:read']), true);
        if ($articleData === null) {
            return new JsonResponse(['message' => 'Error processing article data.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        $articleData['imageUrl'] = $this->imageUploader->getImageUrl($article->getImageFilename());

        return new JsonResponse($articleData, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_article_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('edit', 'article')]
    public function update(
        Request $request,
        Article $article,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted('edit', $article);

        $originalRestaurant = $article->getRestaurant();
        $originalImageFilename = $article->getImageFilename(); // Store old filename

        $data = $request->request->all();
        $serializer->deserialize(json_encode($data), Article::class, 'json', [
            AbstractNormalizer::OBJECT_TO_POPULATE => $article,
            AbstractNormalizer::IGNORED_ATTRIBUTES => ['restaurant', 'imageFilename']
        ]);

        $article->setRestaurant($originalRestaurant);

        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile');
        if ($imageFile) {
            try {
                $newFilename = $this->imageUploader->uploadImage($imageFile);
                $article->setImageFilename($newFilename);
                if ($originalImageFilename && $originalImageFilename !== $newFilename) {
                    $this->imageUploader->deleteImage($originalImageFilename);
                }
            } catch (FileException $e) {
                return $this->json(['errors' => ['imageFile' => $e->getMessage()]], Response::HTTP_BAD_REQUEST);
            }
        }

        $errors = $validator->validate($article);
        if (count($errors) > 0) {
            return $this->formatValidationErrors($errors);
        }

        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}', name: 'api_article_delete', methods: ['DELETE'])]
    #[IsGranted('delete', 'article')]
    public function delete(Article $article, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('delete', $article);

        $imageFilename = $article->getImageFilename();

        $entityManager->remove($article);
        $entityManager->flush();

        if ($imageFilename) {
            $this->imageUploader->deleteImage($imageFilename);
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    private function formatValidationErrors(ConstraintViolationListInterface $errors): JsonResponse
    {
        $errorMessages = [];
        foreach ($errors as $error) {
            $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
        }
        return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
    }
}
