<?php

namespace App\Service;

use App\Entity\Order;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationPublisher
{
    public function __construct(private readonly HubInterface $hub)
    {
    }

    public function publishOrderCreated(Order $order): void
    {
        // Notify restaurant
        $restaurantTopic = sprintf('restaurant/%d', $order->getRestaurant()->getId());
        $restaurantUpdate = new Update(
            $restaurantTopic,
            json_encode([
                'type' => 'order.created',
                'orderId' => $order->getId(),
                'customerName' => $order->getUser()->getName(),
                'totalPrice' => $order->getTotalPrice(),
                'timestamp' => (new \DateTime())->format(\DateTime::ATOM),
            ])
        );
        $this->hub->publish($restaurantUpdate);
    }

    public function publishOrderStatusUpdated(Order $order, string $oldStatus): void
    {
        // Notify user
        $userTopic = sprintf('user/%d', $order->getUser()->getId());
        $userUpdate = new Update(
            $userTopic,
            json_encode([
                'type' => 'order.status_updated',
                'orderId' => $order->getId(),
                'restaurantName' => $order->getRestaurant()->getName(),
                'oldStatus' => $oldStatus,
                'newStatus' => $order->getStatus(),
                'timestamp' => (new \DateTime())->format(\DateTime::ATOM),
            ])
        );
        $this->hub->publish($userUpdate);
    }
}