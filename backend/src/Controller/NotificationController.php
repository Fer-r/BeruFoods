<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api')]
class NotificationController extends AbstractController
{
    public function __construct(
        private NotificationRepository $notificationRepository,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer
    ) {}

    #[Route('/notifications', name: 'api_notifications_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        
        if ($user instanceof \App\Entity\User) {
            $notifications = $this->notificationRepository->findBy(
                ['recipientUser' => $user],
                ['createdAt' => 'DESC'],
                50 // Limit to last 50 notifications
            );
        } elseif ($user instanceof \App\Entity\Restaurant) {
            $notifications = $this->notificationRepository->findBy(
                ['recipientRestaurant' => $user],
                ['createdAt' => 'DESC'],
                50 // Limit to last 50 notifications
            );
        } else {
            return new JsonResponse(['error' => 'Invalid user type'], Response::HTTP_FORBIDDEN);
        }

        $data = $this->serializer->serialize($notifications, 'json', ['groups' => 'notification:read']);
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/notifications/{id}/read', name: 'api_notification_mark_read', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function markAsRead(int $id): JsonResponse
    {
        $notification = $this->notificationRepository->find($id);
        
        if (!$notification) {
            return new JsonResponse(['error' => 'Notification not found'], Response::HTTP_NOT_FOUND);
        }

        // Check if the current user owns this notification
        $user = $this->getUser();
        if (
            ($user instanceof \App\Entity\User && $notification->getRecipientUser() !== $user) ||
            ($user instanceof \App\Entity\Restaurant && $notification->getRecipientRestaurant() !== $user)
        ) {
            return new JsonResponse(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }

        $notification->setIsRead(true);
        $this->entityManager->flush();

        $data = $this->serializer->serialize($notification, 'json', ['groups' => 'notification:read']);
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/notifications/read-all', name: 'api_notifications_mark_all_read', methods: ['PUT', 'PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function markAllAsRead(): JsonResponse
    {
        $user = $this->getUser();
        
        if ($user instanceof \App\Entity\User) {
            $notifications = $this->notificationRepository->findBy([
                'recipientUser' => $user,
                'isRead' => false
            ]);
        } elseif ($user instanceof \App\Entity\Restaurant) {
            $notifications = $this->notificationRepository->findBy([
                'recipientRestaurant' => $user,
                'isRead' => false
            ]);
        } else {
            return new JsonResponse(['error' => 'Invalid user type'], Response::HTTP_FORBIDDEN);
        }

        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }
        
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'All notifications marked as read'], Response::HTTP_OK);
    }

    #[Route('/notifications/clear', name: 'api_notifications_clear', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function clearAll(): JsonResponse
    {
        $user = $this->getUser();
        
        if ($user instanceof \App\Entity\User) {
            $notifications = $this->notificationRepository->findBy(['recipientUser' => $user]);
        } elseif ($user instanceof \App\Entity\Restaurant) {
            $notifications = $this->notificationRepository->findBy(['recipientRestaurant' => $user]);
        } else {
            return new JsonResponse(['error' => 'Invalid user type'], Response::HTTP_FORBIDDEN);
        }

        foreach ($notifications as $notification) {
            $this->entityManager->remove($notification);
        }
        
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'All notifications cleared'], Response::HTTP_OK);
    }
} 