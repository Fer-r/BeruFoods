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
        $this->notificationPublisher->publishOrderCreated($event->getOrder());
    }

    public function onOrderStatusUpdated(OrderStatusUpdatedEvent $event): void
    {
        $this->notificationPublisher->publishOrderStatusUpdated(
            $event->getOrder(),
            $event->getOldStatus()
        );
    }
}