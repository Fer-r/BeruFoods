<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class NotificationPublisher
{
    public function __construct(private readonly HubInterface $hub)
    {
    }

    public function publishToUser(int $userId, string $type, array $data): void
    {
        $this->publish("user/{$userId}", $type, $data);
    }

    public function publishToRestaurant(int $restaurantId, string $type, array $data): void
    {
        $this->publish("restaurant/{$restaurantId}", $type, $data);
    }

    private function publish(string $topic, string $type, array $data): void
    {
        $update = new Update(
            "https://localhost/.well-known/mercure?topic=" . urlencode($topic),
            json_encode([
                'type' => $type,
                'data' => $data,
                'timestamp' => (new \DateTime())->format(\DateTime::ATOM),
            ])
        );

        $this->hub->publish($update);
    }
}