<?php

namespace App\Controller;

use App\Entity\User;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

class MercureController extends AbstractController
{
    private string $mercureJwtSecret;

    public function __construct(ParameterBagInterface $params)
    {
        $this->mercureJwtSecret = $params->get('mercure_jwt_secret');
    }

    #[Route('/api/auth/mercure_token', name: 'app_auth_mercure_token', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function generateSubscriptionToken(): JsonResponse
    {
        $principal = $this->getUser();
        if (!$principal) {
            return new JsonResponse(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $subscribeTopics = [];

        if ($principal instanceof \App\Entity\User) {
            /** @var \App\Entity\User $user */
            $user = $principal;
            $userId = $user->getId();
            if ($userId !== null) {
                $subscribeTopics[] = sprintf('/orders/user/%s', $userId);
                // $subscribeTopics[] = sprintf('https://example.com/users/%s', $userId); // IRI example
            }
        } elseif ($principal instanceof \App\Entity\Restaurant) {
            /** @var \App\Entity\Restaurant $restaurant */
            $restaurant = $principal;
            $restaurantId = $restaurant->getId();
            if ($restaurantId !== null) {
                $subscribeTopics[] = sprintf('/orders/restaurant/%s', $restaurantId);
                // $subscribeTopics[] = sprintf('https://example.com/restaurants/%s', $restaurantId); // IRI example
            }
        } else {
            // Should not happen if security is configured correctly
            return new JsonResponse(['error' => 'Invalid user type for Mercure token'], Response::HTTP_FORBIDDEN);
        }

        if (empty($subscribeTopics)) {
            return new JsonResponse(['error' => 'No topics to subscribe to for this user.'], Response::HTTP_BAD_REQUEST);
        }


        $config = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($this->mercureJwtSecret)
        );

        $now = new \DateTimeImmutable();
        $expiresAt = $now->modify('+1 hour'); // Token valid for 1 hour

        $token = $config->builder()
            ->withClaim('mercure', ['subscribe' => $subscribeTopics])
            ->issuedAt($now)
            ->expiresAt($expiresAt)
            ->getToken($config->signer(), $config->signingKey());

        return new JsonResponse(['mercureToken' => $token->toString()]);
    }
}