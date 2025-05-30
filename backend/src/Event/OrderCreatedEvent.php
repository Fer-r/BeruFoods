<?php

namespace App\Event;

use App\Entity\Order;

class OrderCreatedEvent
{
    public function __construct(private readonly Order $order)
    {
    }

    public function getOrder(): Order
    {
        return $this->order;
    }
}