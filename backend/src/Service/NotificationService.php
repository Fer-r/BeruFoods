<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationService
{
    public function __construct(
        private HubInterface $hub
    ) {}

    public function notifyNewOrder(int $orderId, int $restaurantId): void
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

        $this->hub->publish($update);
    }

    public function notifyOrderStatusChange(int $orderId, int $userId, string $newStatus): void
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

        $this->hub->publish($update);
    }
}