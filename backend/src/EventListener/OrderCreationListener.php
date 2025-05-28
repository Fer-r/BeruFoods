<?php

namespace App\EventListener;

use App\Entity\Notification;
use App\Entity\Order;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Events;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;

#[AsEntityListener(event: Events::postPersist, method: 'onPostPersist', entity: Order::class)]
class OrderCreationListener
{
    public function __construct(
        private HubInterface $mercureHub,
        private SerializerInterface $serializer,
        private EntityManagerInterface $entityManager
    ) {}

    public function onPostPersist(Order $order, PostPersistEventArgs $event): void
    {
        $restaurant = $order->getRestaurant();
        if (!$restaurant || !$restaurant->getId()) {
            // Cannot send notification if restaurant or its ID is not available
            return;
        }

        $notification = new Notification();
        $notification->setRecipientRestaurant($restaurant);
        $notification->setRelatedOrder($order);
        $notification->setType('order_created');
        $notification->setMessage(sprintf(
            'New order #%d received from %s for a total of %s %s.',
            $order->getId(),
            $order->getUser() ? $order->getUser()->getName() : 'a guest user',
            $order->getTotalPrice(),
            'EUR' // Assuming EUR as default currency, or add getCurrency() to Restaurant
        ));
        // No need to call setCreatedAtValue, it's handled by PrePersist in Notification entity

        $this->entityManager->persist($notification);
        $this->entityManager->flush(); // Flush here to ensure notification has an ID for the Mercure update

        $topic = sprintf('/restaurants/%d/notifications', $restaurant->getId());
        $jsonData = $this->serializer->serialize($notification, 'json', ['groups' => 'notification:read']);

        error_log(sprintf('[MERCURE] Publishing to topic: %s', $topic));
        error_log(sprintf('[MERCURE] Notification data: %s', $jsonData));
        error_log(sprintf('[MERCURE] Restaurant ID: %d', $restaurant->getId()));

        $update = new Update(
            $topic,
            $jsonData,
            false // CHANGED TO PUBLIC UPDATE FOR TESTING
        );

        try {
            $this->mercureHub->publish($update);
            error_log(sprintf('[MERCURE] Successfully published to topic: %s', $topic));
        } catch (\Exception $e) {
            error_log(sprintf('[MERCURE] Failed to publish: %s', $e->getMessage()));
        }
    }
} 