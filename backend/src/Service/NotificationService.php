<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Psr\Log\LoggerInterface;

class NotificationService
{
    public function __construct(
        private HubInterface $hub,
        private ?LoggerInterface $logger = null
    ) {}

    public function notifyNewOrder(int $orderId, int $restaurantId): bool
    {
        $update = new Update(
            [
                "order/{$orderId}",
                "restaurant/{$restaurantId}/orders"
            ],
            json_encode([
                'type' => 'new_order',
                'orderId' => $orderId,
                'message' => 'New order received'
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
        $update = new Update(
            [
                "order/{$orderId}",
                "user/{$userId}/orders"
            ],
            json_encode([
                'type' => 'order_status_change',
                'orderId' => $orderId,
                'status' => $newStatus,
                'message' => "Order status changed to {$newStatus}"
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