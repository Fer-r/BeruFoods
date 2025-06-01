<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Entity\Restaurant;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class NotificationController extends AbstractController
{
    public function __construct(
        private NotificationRepository $notificationRepository,
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'app_notifications_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 15)));
        $readFilter = $request->query->has('read') ? $request->query->getBoolean('read') : null;
        
        $principal = $this->getUser();
        
        if ($principal instanceof User) {
            $recipientType = 'user';
            $recipientId = $principal->getId();
        } elseif ($principal instanceof Restaurant) {
            $recipientType = 'restaurant';
            $recipientId = $principal->getId();
        } else {
            return $this->json(['error' => 'Invalid user type'], Response::HTTP_BAD_REQUEST);
        }
        
        $result = $this->notificationRepository->getNotificationsForRecipient(
            $recipientType,
            $recipientId,
            $readFilter,
            $page,
            $limit
        );
        
        return $this->json($result, Response::HTTP_OK, [], ['groups' => ['notification:read']]);
    }

    #[Route('/unread-count', name: 'app_notifications_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $principal = $this->getUser();
        
        if ($principal instanceof User) {
            $recipientType = 'user';
            $recipientId = $principal->getId();
        } elseif ($principal instanceof Restaurant) {
            $recipientType = 'restaurant';
            $recipientId = $principal->getId();
        } else {
            return $this->json(['error' => 'Invalid user type'], Response::HTTP_BAD_REQUEST);
        }
        
        $count = $this->notificationRepository->countUnreadNotifications($recipientType, $recipientId);
        
        return $this->json(['count' => $count]);
    }

    #[Route('/{id}/read', name: 'app_notifications_mark_read', methods: ['PUT'])]
    public function markAsRead(Notification $notification): JsonResponse
    {
        $principal = $this->getUser();
        
        if ($principal instanceof User) {
            $recipientType = 'user';
            $recipientId = $principal->getId();
        } elseif ($principal instanceof Restaurant) {
            $recipientType = 'restaurant';
            $recipientId = $principal->getId();
        } else {
            return $this->json(['error' => 'Invalid user type'], Response::HTTP_BAD_REQUEST);
        }
        
        // Security check - only the recipient can mark their notifications as read
        if ($notification->getRecipientType() !== $recipientType || $notification->getRecipientId() !== $recipientId) {
            return $this->json(['error' => 'Access Denied'], Response::HTTP_FORBIDDEN);
        }
        
        $notification->setRead(true);
        $this->entityManager->flush();
        
        return $this->json([
            'success' => true,
            'notification' => [
                'id' => $notification->getId(),
                'isRead' => $notification->isRead(),
                'readAt' => $notification->getReadAt()
            ]
        ]);
    }

    #[Route('/read-all', name: 'app_notifications_mark_all_read', methods: ['PUT'])]
    public function markAllAsRead(): JsonResponse
    {
        $principal = $this->getUser();
        
        if ($principal instanceof User) {
            $recipientType = 'user';
            $recipientId = $principal->getId();
        } elseif ($principal instanceof Restaurant) {
            $recipientType = 'restaurant';
            $recipientId = $principal->getId();
        } else {
            return $this->json(['error' => 'Invalid user type'], Response::HTTP_BAD_REQUEST);
        }
        
        $count = $this->notificationRepository->markAllAsRead($recipientType, $recipientId);
        
        return $this->json([
            'success' => true,
            'count' => $count
        ]);
    }
}