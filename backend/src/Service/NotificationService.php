<?php

namespace App\Service;

use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Psr\Log\LoggerInterface;

class NotificationService
{
    public function __construct(
        private HubInterface $hub,
        private EntityManagerInterface $entityManager,
        private ?LoggerInterface $logger = null
    ) {}

    public function notifyNewOrder(int $orderId, int $restaurantId): bool
    {
        $type = 'new_order';
        $message = 'New order received';
        
        // Persist notification in database
        $notification = new Notification();
        $notification->setType($type);
        $notification->setMessage($message);
        $notification->setRelatedEntityType('order');
        $notification->setRelatedEntityId($orderId);
        $notification->setRecipientType('restaurant');
        $notification->setRecipientId($restaurantId);
        
        $this->entityManager->persist($notification);
        $this->entityManager->flush();
        
        // Publish to Mercure hub
        $update = new Update(
            [
                "order/{$orderId}",
                "restaurant/{$restaurantId}/orders"
            ],
            json_encode([
                'type' => $type,
                'orderId' => $orderId,
                'message' => $message
            ])
        );

        try {
            $this->hub->publish($update);
            return true;
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Failed to publish new order notification to Mercure hub', [
                    'orderId' => $orderId,
                    'restaurantId' => $restaurantId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return false;
        }
    }

    public function notifyOrderStatusChange(int $orderId, int $userId, string $newStatus): bool
    {
        $type = 'order_status_change';
        $message = "Order status changed to {$newStatus}";
        
        // Persist notification in database
        $notification = new Notification();
        $notification->setType($type);
        $notification->setMessage($message);
        $notification->setRelatedEntityType('order');
        $notification->setRelatedEntityId($orderId);
        $notification->setRecipientType('user');
        $notification->setRecipientId($userId);
        
        $this->entityManager->persist($notification);
        $this->entityManager->flush();
        
        // Publish to Mercure hub
        $update = new Update(
            [
                "order/{$orderId}",
                "user/{$userId}/orders"
            ],
            json_encode([
                'type' => $type,
                'orderId' => $orderId,
                'status' => $newStatus,
                'message' => $message
            ])
        );

        try {
            $this->hub->publish($update);
            return true;
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Failed to publish order status change notification to Mercure hub', [
                    'orderId' => $orderId,
                    'userId' => $userId,
                    'status' => $newStatus,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return false;
        }
    }
}