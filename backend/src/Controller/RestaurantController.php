<?php

namespace App\Controller;

use App\Entity\Restaurant; // Use Restaurant entity
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[Route('/api/restaurant')] // Base path for restaurant routes
final class RestaurantController extends AbstractController
{
    #[Route('/register', name: 'api_restaurant_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json(['message' => 'Missing email or password'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $email = $data['email'];
        $password = $data['password'];

        $emailConstraint = new Assert\Email();
        $errors = $validator->validate($email, $emailConstraint);
        if (count($errors) > 0) {
            return $this->json(['message' => 'Invalid email format'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Check if restaurant already exists
        $existingRestaurant = $entityManager->getRepository(Restaurant::class)->findOneBy(['email' => $email]);
        if ($existingRestaurant) {
            return $this->json(['message' => 'Restaurant already exists'], JsonResponse::HTTP_CONFLICT);
        }

        $restaurant = new Restaurant();
        $restaurant->setEmail($email);

        // Hash password
        $hashedPassword = $passwordHasher->hashPassword($restaurant, $password);
        $restaurant->setPassword($hashedPassword);
        $restaurant->setRoles(['ROLE_RESTAURANT']); // Assign Restaurant role

        // Persist restaurant
        $entityManager->persist($restaurant);
        $entityManager->flush();

        return $this->json(['message' => 'Restaurant registered successfully'], JsonResponse::HTTP_CREATED);
    }

    // No login method needed here - handled by security firewall
} 