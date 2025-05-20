<?php

namespace App\EventListener;

use App\Entity\Notification;
use App\Entity\Order;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;

#[AsEntityListener(event: Events::postUpdate, method: 'onPostUpdate', entity: Order::class)]
class OrderStatusUpdateListener
{
    public function __construct(
        private HubInterface $mercureHub,
        private SerializerInterface $serializer,
        private EntityManagerInterface $entityManager
    ) {}

    public function onPostUpdate(Order $order, PostUpdateEventArgs $event): void
    {
        $unitOfWork = $this->entityManager->getUnitOfWork();
        $changeSet = $unitOfWork->getEntityChangeSet($order);

        // Check if the 'status' field was changed
        if (!isset($changeSet['status'])) {
            return;
        }

        $oldStatus = $changeSet['status'][0];
        $newStatus = $changeSet['status'][1];

        // Only send notification if the status actually changed
        if ($oldStatus === $newStatus) {
            return;
        }

        $user = $order->getUser();
        if (!$user || !$user->getId()) {
            // Cannot send notification if user or user ID is not available
            return;
        }

        $notification = new Notification();
        $notification->setRecipientUser($user);
        $notification->setRelatedOrder($order);
        $notification->setType('order_status_update');
        $notification->setMessage(sprintf(
            'The status of your order #%d has been updated to: %s.',
            $order->getId(),
            $newStatus
        ));

        $this->entityManager->persist($notification);
        $this->entityManager->flush(); // Flush here to ensure notification has an ID

        $topic = sprintf('/users/%d/notifications', $user->getId());
        $jsonData = $this->serializer->serialize($notification, 'json', ['groups' => 'notification:read']);

        $update = new Update(
            $topic,
            $jsonData,
            true // private update
        );

        $this->mercureHub->publish($update);
    }
} 