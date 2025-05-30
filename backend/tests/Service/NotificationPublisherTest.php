<?php

namespace App\Tests\Service;

use App\Entity\Order;
use App\Entity\Restaurant;
use App\Entity\User;
use App\Service\NotificationPublisher;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationPublisherTest extends TestCase
{
    private HubInterface $hub;
    private NotificationPublisher $publisher;
    private Order $order;
    private Restaurant $restaurant;
    private User $user;

    protected function setUp(): void
    {
        $this->hub = $this->createMock(HubInterface::class);
        $this->publisher = new NotificationPublisher($this->hub);

        // Set up test data
        $this->restaurant = $this->createMock(Restaurant::class);
        $this->restaurant->method('getId')->willReturn(1);
        $this->restaurant->method('getName')->willReturn('Test Restaurant');

        $this->user = $this->createMock(User::class);
        $this->user->method('getId')->willReturn(1);
        $this->user->method('getName')->willReturn('Test User');

        $this->order = $this->createMock(Order::class);
        $this->order->method('getId')->willReturn(1);
        $this->order->method('getRestaurant')->willReturn($this->restaurant);
        $this->order->method('getUser')->willReturn($this->user);
        $this->order->method('getTotalPrice')->willReturn('25.99');
        $this->order->method('getStatus')->willReturn('preparing');
    }

    public function testPublishOrderCreated(): void
    {
        $this->hub->expects($this->once())
            ->method('publish')
            ->with($this->callback(function (Update $update) {
                $data = json_decode($update->getData(), true);
                return $update->getTopics() === ['restaurant/1'] &&
                    $data['type'] === 'order.created' &&
                    $data['orderId'] === 1 &&
                    $data['customerName'] === 'Test User' &&
                    $data['totalPrice'] === '25.99';
            }));

        $this->publisher->publishOrderCreated($this->order);
    }

    public function testPublishOrderStatusUpdated(): void
    {
        $oldStatus = 'pending';

        $this->hub->expects($this->once())
            ->method('publish')
            ->with($this->callback(function (Update $update) use ($oldStatus) {
                $data = json_decode($update->getData(), true);
                return $update->getTopics() === ['user/1'] &&
                    $data['type'] === 'order.status_updated' &&
                    $data['orderId'] === 1 &&
                    $data['restaurantName'] === 'Test Restaurant' &&
                    $data['oldStatus'] === $oldStatus &&
                    $data['newStatus'] === 'preparing';
            }));

        $this->publisher->publishOrderStatusUpdated($this->order, $oldStatus);
    }
}