<?php

namespace App\Security;

use App\Entity\Restaurant;
use App\Repository\RestaurantRepository;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class RestaurantProvider implements UserProviderInterface
{
    private RestaurantRepository $restaurantRepository;

    public function __construct(RestaurantRepository $restaurantRepository)
    {
        $this->restaurantRepository = $restaurantRepository;
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $restaurant = $this->restaurantRepository->findOneBy(['email' => $identifier]);

        if (!$restaurant) {
            throw new UserNotFoundException(sprintf('Restaurant with email "%s" not found.', $identifier));
        }

        if ($restaurant->isBanned()) {
            throw new CustomUserMessageAuthenticationException('Your restaurant account has been banned. Please contact support.');
        }

        return $restaurant;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof Restaurant) {
            throw new \InvalidArgumentException(sprintf('Expected an instance of %s, but got "%s".', Restaurant::class, get_class($user)));
        }

        $refreshedRestaurant = $this->restaurantRepository->find($user->getId());

        if (!$refreshedRestaurant) {
            throw new UserNotFoundException('Restaurant not found');
        }

        if ($refreshedRestaurant->isBanned()) {
            throw new CustomUserMessageAuthenticationException('Your restaurant account has been banned. Please contact support.');
        }

        return $refreshedRestaurant;
    }

    public function supportsClass(string $class): bool
    {
        return Restaurant::class === $class || is_subclass_of($class, Restaurant::class);
    }
} 