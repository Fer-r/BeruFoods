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
        $subscribeTopics = [];

        if ($subject instanceof Restaurant && $subject->getId()) {
            $payload['restaurant_id'] = $subject->getId();
            // Topic for this specific restaurant's notifications
            $subscribeTopics[] = sprintf("/restaurants/%d/notifications", $subject->getId());
            // Potentially other general topics a restaurant might listen to
            // $subscribeTopics[] = "/restaurants/all/updates"; 

        } elseif ($subject instanceof User && $subject->getId()) {
            $payload['user_id'] = $subject->getId();
            // Topic for this specific user's notifications
            $subscribeTopics[] = sprintf("/users/%d/notifications", $subject->getId());
            // Potentially other general topics a user might listen to
            // $subscribeTopics[] = "/users/all/promotions";
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
                'province' => $addressEntity->getProvince(),
                'latitude' => $addressEntity->getLat(),
                'longitude' => $addressEntity->getLng(),
            ];
        } else {
            $payload['address'] = null;
        }

        // Add Mercure claims if there are topics to subscribe to
        if (!empty($subscribeTopics)) {
            $payload['mercure'] = [
                'subscribe' => $subscribeTopics,
                // 'publish' => [] // Optionally, if users/restaurants can publish to certain topics directly
            ];
        }

        $event->setData($payload);
    }
} 