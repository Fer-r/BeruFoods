<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\Restaurant;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

#[Route('/api')]
class NotificationController extends AbstractController
{
    private const NOTIFICATION_LIMIT = 50;
    private const SERIALIZATION_GROUPS = ['groups' => 'notification:read'];
    
    private const ERROR_NOTIFICATION_NOT_FOUND = 'Notification not found';
    private const ERROR_ACCESS_DENIED = 'Access denied';
    private const ERROR_INVALID_USER_TYPE = 'Invalid user type';
    
    private const SUCCESS_ALL_MARKED_READ = 'All notifications marked as read';
    private const SUCCESS_ALL_CLEARED = 'All notifications cleared';

    public function __construct(
        private NotificationRepository $notificationRepository,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer,
        private HubInterface $mercureHub
    ) {}

    #[Route('/notifications', name: 'api_notifications_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        $notifications = $this->getUserNotifications($user);
        
        if ($notifications === null) {
            return $this->createErrorResponse(self::ERROR_INVALID_USER_TYPE, Response::HTTP_FORBIDDEN);
        }

        return $this->createSuccessResponse($notifications);
    }

    #[Route('/notifications/{id}/read', name: 'api_notification_mark_read', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function markAsRead(int $id): JsonResponse
    {
        $notification = $this->notificationRepository->find($id);
        
        if (!$notification) {
            return $this->createErrorResponse(self::ERROR_NOTIFICATION_NOT_FOUND, Response::HTTP_NOT_FOUND);
        }

        if (!$this->userOwnsNotification($this->getUser(), $notification)) {
            return $this->createErrorResponse(self::ERROR_ACCESS_DENIED, Response::HTTP_FORBIDDEN);
        }

        $notification->setIsRead(true);
        $this->entityManager->flush();

        return $this->createSuccessResponse($notification);
    }

    #[Route('/notifications/read-all', name: 'api_notifications_mark_all_read', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function markAllAsRead(): JsonResponse
    {
        $user = $this->getUser();
        $notifications = $this->getUnreadUserNotifications($user);
        
        if ($notifications === null) {
            return $this->createErrorResponse(self::ERROR_INVALID_USER_TYPE, Response::HTTP_FORBIDDEN);
        }

        $this->markNotificationsAsRead($notifications);
        
        return $this->createMessageResponse(self::SUCCESS_ALL_MARKED_READ);
    }

    #[Route('/notifications/clear', name: 'api_notifications_clear', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function clearAll(): JsonResponse
    {
        $user = $this->getUser();
        $notifications = $this->getAllUserNotifications($user);
        
        if ($notifications === null) {
            return $this->createErrorResponse(self::ERROR_INVALID_USER_TYPE, Response::HTTP_FORBIDDEN);
        }

        $this->removeNotifications($notifications);
        
        return $this->createMessageResponse(self::SUCCESS_ALL_CLEARED);
    }

    #[Route('/notifications/test', name: 'api_notifications_test', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function testNotification(): JsonResponse
    {
        $user = $this->getUser();
        
        if ($user instanceof \App\Entity\Restaurant) {
            // Create a test notification
            $notification = new Notification();
            $notification->setRecipientRestaurant($user);
            $notification->setType('test');
            $notification->setMessage('This is a test notification - ' . date('H:i:s'));
            
            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            // Publish to Mercure
            $topic = sprintf('/restaurants/%d/notifications', $user->getId());
            $jsonData = $this->serializer->serialize($notification, 'json', ['groups' => 'notification:read']);

            error_log(sprintf('[TEST MERCURE] Publishing to topic: %s', $topic));
            error_log(sprintf('[TEST MERCURE] Data: %s', $jsonData));

            $update = new Update(
                $topic,
                $jsonData,
                true // BACK TO PRIVATE UPDATE
            );

            try {
                $this->mercureHub->publish($update);
                error_log('[TEST MERCURE] Successfully published test notification');
                
                return new JsonResponse([
                    'message' => 'Test notification sent',
                    'topic' => $topic,
                    'notification' => json_decode($jsonData, true)
                ], Response::HTTP_OK);
            } catch (\Exception $e) {
                error_log(sprintf('[TEST MERCURE] Failed to publish: %s', $e->getMessage()));
                return new JsonResponse(['error' => 'Failed to publish notification: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }
        
        return new JsonResponse(['error' => 'Only restaurants can test notifications'], Response::HTTP_FORBIDDEN);
    }

    private function getUserNotifications($user): ?array
    {
        if ($user instanceof User) {
            return $this->notificationRepository->findBy(
                ['recipientUser' => $user],
                ['createdAt' => 'DESC'],
                self::NOTIFICATION_LIMIT
            );
        }
        
        if ($user instanceof Restaurant) {
            return $this->notificationRepository->findBy(
                ['recipientRestaurant' => $user],
                ['createdAt' => 'DESC'],
                self::NOTIFICATION_LIMIT
            );
        }
        
        return null;
    }

    private function getUnreadUserNotifications($user): ?array
    {
        if ($user instanceof User) {
            return $this->notificationRepository->findBy([
                'recipientUser' => $user,
                'isRead' => false
            ]);
        }
        
        if ($user instanceof Restaurant) {
            return $this->notificationRepository->findBy([
                'recipientRestaurant' => $user,
                'isRead' => false
            ]);
        }
        
        return null;
    }

    private function getAllUserNotifications($user): ?array
    {
        if ($user instanceof User) {
            return $this->notificationRepository->findBy(['recipientUser' => $user]);
        }
        
        if ($user instanceof Restaurant) {
            return $this->notificationRepository->findBy(['recipientRestaurant' => $user]);
        }
        
        return null;
    }

    private function userOwnsNotification($user, Notification $notification): bool
    {
        return ($user instanceof User && $notification->getRecipientUser() === $user) ||
               ($user instanceof Restaurant && $notification->getRecipientRestaurant() === $user);
    }

    private function markNotificationsAsRead(array $notifications): void
    {
        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }
        
        $this->entityManager->flush();
    }

    private function removeNotifications(array $notifications): void
    {
        foreach ($notifications as $notification) {
            $this->entityManager->remove($notification);
        }
        
        $this->entityManager->flush();
    }

    private function createSuccessResponse($data): JsonResponse
    {
        $serializedData = $this->serializer->serialize($data, 'json', self::SERIALIZATION_GROUPS);
        return new JsonResponse($serializedData, Response::HTTP_OK, [], true);
    }

    private function createErrorResponse(string $message, int $statusCode): JsonResponse
    {
        return new JsonResponse(['error' => $message], $statusCode);
    }

    private function createMessageResponse(string $message): JsonResponse
    {
        return new JsonResponse(['message' => $message], Response::HTTP_OK);
    }
} 