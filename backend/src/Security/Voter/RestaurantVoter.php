<?php

namespace App\Security\Voter;

use App\Entity\Restaurant;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

class RestaurantVoter extends Voter
{
    public const EDIT = 'edit';

    public function __construct(private Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EDIT
            && $subject instanceof Restaurant;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $loggedInUser = $token->getUser();

        if (!$loggedInUser instanceof UserInterface) {
            return false;
        }

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        /** @var Restaurant $restaurantSubject */
        $restaurantSubject = $subject;

        // Check if the logged-in user is the Restaurant itself
        return $restaurantSubject === $loggedInUser;
    }
} 