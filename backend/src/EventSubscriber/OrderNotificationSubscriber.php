<?php

namespace App\EventSubscriber;

use App\Event\OrderCreatedEvent;
use App\Event\OrderStatusUpdatedEvent;
use App\Service\NotificationPublisher;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class OrderNotificationSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly NotificationPublisher $notificationPublisher)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            OrderCreatedEvent::class => 'onOrderCreated',
            OrderStatusUpdatedEvent::class => 'onOrderStatusUpdated',
        ];
    }

    public function onOrderCreated(OrderCreatedEvent $event): void
    {
        $order = $event->getOrder();
        
        // Notify restaurant about new order
        $this->notificationPublisher->publishToRestaurant(
            $order->getRestaurant()->getId(),
            'order.created',
            [
                'orderId' => $order->getId(),
                'customerName' => $order->getUser()->getName(),
                'totalPrice' => $order->getTotalPrice(),
                'items' => $order->getItems(),
            ]
        );

        // Notify user about order confirmation
        $this->notificationPublisher->publishToUser(
            $order->getUser()->getId(),
            'order.confirmed',
            [
                'orderId' => $order->getId(),
                'restaurantName' => $order->getRestaurant()->getName(),
                'status' => $order->getStatus(),
            ]
        );
    }

    public function onOrderStatusUpdated(OrderStatusUpdatedEvent $event): void
    {
        $order = $event->getOrder();
        $oldStatus = $event->getOldStatus();

        // Notify user about status change
        $this->notificationPublisher->publishToUser(
            $order->getUser()->getId(),
            'order.status_updated',
            [
                'orderId' => $order->getId(),
                'restaurantName' => $order->getRestaurant()->getName(),
                'oldStatus' => $oldStatus,
                'newStatus' => $order->getStatus(),
            ]
        );
    }
}