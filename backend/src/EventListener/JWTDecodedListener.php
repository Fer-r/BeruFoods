<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

class JWTDecodedListener
{
    public function onJWTDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();

        // Check if the user/restaurant is banned based on the token payload
        if (isset($payload['banned']) && $payload['banned'] === true) {
            throw new CustomUserMessageAuthenticationException('Your account has been banned. Please contact support.');
        }
    }
} 