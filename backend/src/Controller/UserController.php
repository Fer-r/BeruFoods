<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;

#[Route('/api')]
final class UserController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10;

    #[Route('/users', name: 'api_user_index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(UserRepository $userRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

        $qb = $userRepository->createQueryBuilder('u');

        $qb->orderBy('u.email', 'ASC')
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $paginator = new Paginator($qb->getQuery(), true);
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);

        $results = iterator_to_array($paginator->getIterator());

        $data = [
            'items' => $results,
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        $json = $serializer->serialize($data, 'json', ['groups' => 'user:read:collection']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/users/{id}', name: 'api_user_show', methods: ['GET'])]
    #[IsGranted('view', 'user')]
    public function show(User $user, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $user);

        $json = $serializer->serialize($user, 'json', ['groups' => 'user:read']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/users/{id}', name: 'api_user_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('edit', 'user')]
    public function update(
        Request $request,
        User $user,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $this->denyAccessUnlessGranted('edit', $user);

        $serializer->deserialize($request->getContent(), User::class, 'json', [AbstractNormalizer::OBJECT_TO_POPULATE => $user]);

        $data = json_decode($request->getContent(), true);
        if (isset($data['password'])) {
             if (strlen($data['password']) >= 6) {
                  $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
                  $user->setPassword($hashedPassword);
             } else {
                 return $this->json(['errors' => ['password' => ['Password must be at least 6 characters long']]], Response::HTTP_BAD_REQUEST);
             }
        }

        $errors = $validator->validate($user);
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

    #[Route('/users/{id}', name: 'api_user_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($user);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/users/{id}/ban', name: 'api_user_ban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function ban(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $user->setBanned(true);
        $entityManager->flush();
        return new JsonResponse(['message' => 'User banned successfully.'], Response::HTTP_OK);
    }

    #[Route('/users/{id}/unban', name: 'api_user_unban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function unban(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $user->setBanned(false);
        $entityManager->flush();
        return new JsonResponse(['message' => 'User unbanned successfully.'], Response::HTTP_OK);
    }
}
