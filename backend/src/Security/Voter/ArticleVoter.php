<?php

namespace App\Security\Voter;

use App\Entity\Article;
use App\Entity\Restaurant;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

class ArticleVoter extends Voter
{
    public const EDIT = 'edit';
    public const DELETE = 'delete';

    public function __construct(private Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::EDIT, self::DELETE])
            && $subject instanceof Article;
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

        // Only Restaurants can edit/delete articles they own
        if (!$loggedInUser instanceof Restaurant) {
            return false;
        }

        /** @var Article $articleSubject */
        $articleSubject = $subject;

        // Check if the logged-in restaurant owns the article
        return $articleSubject->getRestaurant() === $loggedInUser;
    }
} 