<?php

namespace App\EventListener;

use App\Entity\Restaurant;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\HttpFoundation\RequestStack;
use App\Entity\User;

class JWTAuthenticatedListener
{
    private RequestStack $requestStack;

    public function __construct(RequestStack $requestStack)
    {
        $this->requestStack = $requestStack;
    }

    /**
     * @param JWTCreatedEvent $event
     *
     * @return void
     */
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $payload = $event->getData();
        $subject = $event->getUser();

        if ($subject instanceof Restaurant) {
            $payload['restaurant_id'] = $subject->getId();
            $payload['banned'] = $subject->isBanned();
        } elseif ($subject instanceof User) {
            $payload['user_id'] = $subject->getId();
            $payload['banned'] = $subject->isBanned();
        }

        $addressEntity = null;
        if ($subject instanceof User) {
            $addressEntity = $subject->getAddress();
        } elseif ($subject instanceof Restaurant) {
            $addressEntity = $subject->getAddress();
        }

        if ($addressEntity) {
            $payload['address'] = [
                'address_line' => $addressEntity->getAddressLine(),
                'latitude' => $addressEntity->getLat(),
                'longitude' => $addressEntity->getLng(),
            ];
            $subject instanceof Restaurant ? $payload['address']['city'] = null : $payload['address']['city'] = $addressEntity->getCity();
        } else {
            $payload['address'] = null;
        }

        $event->setData($payload);
    }
} 