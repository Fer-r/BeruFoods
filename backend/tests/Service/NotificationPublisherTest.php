<?php

namespace App\Tests\Service;

use App\Service\NotificationPublisher;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationPublisherTest extends TestCase
{
    private HubInterface $hub;
    private NotificationPublisher $publisher;

    protected function setUp(): void
    {
        $this->hub = $this->createMock(HubInterface::class);
        $this->publisher = new NotificationPublisher($this->hub);
    }

    public function testPublishToUser(): void
    {
        $userId = 123;
        $type = 'test.event';
        $data = ['key' => 'value'];

        $this->hub->expects($this->once())
            ->method('publish')
            ->with($this->callback(function (Update $update) use ($userId, $type) {
                $payload = json_decode($update->getData(), true);
                return str_contains($update->getTopics()[0], "user/{$userId}")
                    && $payload['type'] === $type
                    && isset($payload['timestamp']);
            }));

        $this->publisher->publishToUser($userId, $type, $data);
    }

    public function testPublishToRestaurant(): void
    {
        $restaurantId = 456;
        $type = 'test.event';
        $data = ['key' => 'value'];

        $this->hub->expects($this->once())
            ->method('publish')
            ->with($this->callback(function (Update $update) use ($restaurantId, $type) {
                $payload = json_decode($update->getData(), true);
                return str_contains($update->getTopics()[0], "restaurant/{$restaurantId}")
                    && $payload['type'] === $type
                    && isset($payload['timestamp']);
            }));

        $this->publisher->publishToRestaurant($restaurantId, $type, $data);
    }
}