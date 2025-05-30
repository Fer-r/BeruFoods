<?php

namespace App\Event;

use App\Entity\Order;

class OrderStatusUpdatedEvent
{
    public function __construct(
        private readonly Order $order,
        private readonly string $oldStatus
    ) {
    }

    public function getOrder(): Order
    {
        return $this->order;
    }

    public function getOldStatus(): string
    {
        return $this->oldStatus;
    }
}