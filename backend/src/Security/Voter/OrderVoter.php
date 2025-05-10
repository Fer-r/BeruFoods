<?php

namespace App\Security\Voter;

use App\Entity\Order;
use App\Entity\Restaurant;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

class OrderVoter extends Voter
{
    public const VIEW = 'view';
    public const UPDATE_STATUS = 'update_status';

    public function __construct(private Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::UPDATE_STATUS])
            && $subject instanceof Order;
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

        /** @var Order $orderSubject */
        $orderSubject = $subject;

        switch ($attribute) {
            case self::VIEW:
                // Check if user is the owner OR the restaurant is the owner
                return ($loggedInUser instanceof User && $orderSubject->getUser() === $loggedInUser)
                    || ($loggedInUser instanceof Restaurant && $orderSubject->getRestaurant() === $loggedInUser);

            case self::UPDATE_STATUS:
                // Check: Is user the owning restaurant?
                if (!$loggedInUser instanceof Restaurant || $orderSubject->getRestaurant() !== $loggedInUser) {
                    return false;
                }

                // Check: Is the order currently in a state the restaurant can change?
                $currentState = $orderSubject->getStatus();
                $modifiableStates = ['pendiente', 'preparando']; // Restaurant can change from these states

                return in_array($currentState, $modifiableStates);
        }

        return false; // Should not be reached if supports() is correct
    }
} 