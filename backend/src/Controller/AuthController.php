<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Entity\Restaurant; // For restaurant registration
use App\Repository\RestaurantRepository; // For restaurant registration
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')] // Base route for auth actions
final class AuthController extends AbstractController
{
    #[Route('/register/user', name: 'api_auth_register_user', methods: ['POST'])]
    public function registerUser(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json(['message' => 'Missing email or password'], Response::HTTP_BAD_REQUEST);
        }

        // Basic validation (use Validator component for better validation)
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
             return $this->json(['message' => 'Invalid email format'], Response::HTTP_BAD_REQUEST);
        }
        if (strlen($data['password']) < 6) {
             return $this->json(['message' => 'Password must be at least 6 characters long'], Response::HTTP_BAD_REQUEST);
        }

        $existingUser = $userRepository->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json(['message' => 'User email already exists'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name'] ?? null);
        $user->setPhone($data['phone'] ?? null);

        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);
        $user->setRoles(['ROLE_USER']);

        // Validate the User entity
        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json(['message' => 'User registered successfully', 'userId' => $user->getId()], Response::HTTP_CREATED);
    }

    #[Route('/register/restaurant', name: 'api_auth_register_restaurant', methods: ['POST'])]
    public function registerRestaurant(
        Request $request,
        UserPasswordHasherInterface $passwordHasher, // Use the same hasher interface
        EntityManagerInterface $entityManager,
        RestaurantRepository $restaurantRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Basic validation for required fields
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            return $this->json(['message' => 'Missing required fields: email, password, name'], Response::HTTP_BAD_REQUEST);
        }

        // Basic validation (use Validator component for better validation)
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
             return $this->json(['message' => 'Invalid email format'], Response::HTTP_BAD_REQUEST);
        }
        if (strlen($data['password']) < 6) {
             return $this->json(['message' => 'Password must be at least 6 characters long'], Response::HTTP_BAD_REQUEST);
        }

        $existingRestaurant = $restaurantRepository->findOneBy(['email' => $data['email']]);
        if ($existingRestaurant) {
            return $this->json(['message' => 'Restaurant email already exists'], Response::HTTP_CONFLICT);
        }

        $restaurant = new Restaurant();
        $restaurant->setEmail($data['email']);
        $restaurant->setName($data['name']); // Name is required
        $restaurant->setPhone($data['phone'] ?? null); // Optional fields
        $restaurant->setTakesReservations($data['takes_reservations'] ?? false);
        $restaurant->setTableCount($data['table_count'] ?? null);

        // Handle Address creation/linking if provided
        // This might require more complex logic depending on how address is sent
        // if (isset($data['address'])) { ... }

        // Handle FoodTypes linking if provided (expecting array of IDs)
        // This would require fetching FoodType entities and adding them
        // if (isset($data['food_type_ids'])) { ... }

        $hashedPassword = $passwordHasher->hashPassword($restaurant, $data['password']);
        $restaurant->setPassword($hashedPassword);
        $restaurant->setRoles(['ROLE_RESTAURANT']);

        // Validate the Restaurant entity
        $errors = $validator->validate($restaurant);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($restaurant);
        $entityManager->flush();

        return $this->json(['message' => 'Restaurant registered successfully', 'restaurantId' => $restaurant->getId()], Response::HTTP_CREATED);
    }

    // Login check endpoint (/api/login_check) is handled by LexikJWTAuthenticationBundle
    // We might add an endpoint like /api/auth/me to get current user info after login
    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function getCurrentUser(SerializerInterface $serializer): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['message' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Use appropriate serialization group (e.g., 'user:read:self' or 'restaurant:read:self')
        // Need to differentiate between User and Restaurant types
        $groups = [];
        if ($user instanceof User) {
            $groups = ['user:read']; // Or a more specific 'user:read:self'
        } elseif ($user instanceof Restaurant) {
            $groups = ['restaurant:read']; // Or 'restaurant:read:self'
        }

        if (empty($groups)){
             return $this->json(['message' => 'Cannot determine user type for serialization'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $json = $serializer->serialize($user, 'json', ['groups' => $groups]);

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
} 