<?php

namespace App\Security\Voter;

use App\Entity\Reservation;
use App\Entity\Restaurant;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

class ReservationVoter extends Voter
{
    public const VIEW = 'view';
    public const UPDATE_STATE = 'update_state';
    public const CANCEL = 'cancel'; // Added for user cancellation

    public function __construct(private Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        // Add CANCEL to supported attributes
        return in_array($attribute, [self::VIEW, self::UPDATE_STATE, self::CANCEL])
            && $subject instanceof Reservation;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $loggedInUser = $token->getUser();

        if (!$loggedInUser instanceof UserInterface) {
            return false;
        }

        // Admin can do anything
        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        /** @var Reservation $reservationSubject */
        $reservationSubject = $subject;

        // Get the CURRENT state from the object fetched from DB
        $currentState = $reservationSubject->getState();

        switch ($attribute) {
            case self::VIEW:
                return ($loggedInUser instanceof User
                    && $reservationSubject->getUser()?->getId() === $loggedInUser->getId())
                    || ($loggedInUser instanceof Restaurant
                        && $reservationSubject->getRestaurant()?->getId() === $loggedInUser->getId());

            case self::UPDATE_STATE:
                // Check: Is user the owning restaurant AND is the reservation in a state they can modify?
                if (!$loggedInUser instanceof Restaurant || $reservationSubject->getRestaurant()?->getId() !== $loggedInUser->getId()) {
                    return false;
                }
                // Restaurant can only modify 'pending' reservations (e.g., to confirm or cancel)
                return $currentState === 'pending';

             case self::CANCEL:
                 // Check: Is user the owning user AND is the reservation in a cancellable state AND is the time okay?
                 if (!$loggedInUser instanceof User || $reservationSubject->getUser()?->getId() !== $loggedInUser->getId()) {
                     return false;
                 }
                 // User can cancel 'pending' or 'confirmed'
                 $canCancelState = in_array($currentState, ['pending', 'confirmed']);
                 if (!$canCancelState) {
                    return false;
                 }

                 // Time check: Can only cancel if reservation is more than 24 hours away
                 $reservationTime = $reservationSubject->getReservationDatetime();
                 if (!$reservationTime) {
                    return false;
                 }
                 if ($reservationTime instanceof \DateTimeImmutable) {
                    $reservationDateTime = $reservationTime;
                 } else { // It might be a \DateTime
                    $reservationDateTime = \DateTimeImmutable::createFromMutable($reservationTime);
                 }
                 $cancellationDeadline = $reservationDateTime->modify('-24 hours');
                 $now = new \DateTimeImmutable();
                 return $now < $cancellationDeadline;
        }

        return false; // Should not be reached
    }
} 