# Persistent Notification System Implementation Plan

This document outlines the detailed implementation plan for adding persistence to notifications in the BeruFoods application.

## Table of Contents
- [Database Design](#database-design)
- [Backend Implementation](#backend-implementation)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Performance Considerations](#performance-considerations)

## Database Design

### Notification Entity

```php
<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['notification:read'])]
    private string $type;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['notification:read'])]
    private string $message;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['notification:read'])]
    private string $relatedEntityType;

    #[ORM\Column(type: 'integer')]
    #[Groups(['notification:read'])]
    private int $relatedEntityId;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['notification:read'])]
    private string $recipientType;

    #[ORM\Column(type: 'integer')]
    #[Groups(['notification:read'])]
    private int $recipientId;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['notification:read'])]
    private bool $read = false;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['notification:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['notification:read'])]
    private ?\DateTimeImmutable $readAt = null;

    // Getters and setters...
    
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function getRelatedEntityType(): string
    {
        return $this->relatedEntityType;
    }

    public function setRelatedEntityType(string $relatedEntityType): self
    {
        $this->relatedEntityType = $relatedEntityType;
        return $this;
    }

    public function getRelatedEntityId(): int
    {
        return $this->relatedEntityId;
    }

    public function setRelatedEntityId(int $relatedEntityId): self
    {
        $this->relatedEntityId = $relatedEntityId;
        return $this;
    }

    public function getRecipientType(): string
    {
        return $this->recipientType;
    }

    public function setRecipientType(string $recipientType): self
    {
        $this->recipientType = $recipientType;
        return $this;
    }

    public function getRecipientId(): int
    {
        return $this->recipientId;
    }

    public function setRecipientId(int $recipientId): self
    {
        $this->recipientId = $recipientId;
        return $this;
    }

    public function isRead(): bool
    {
        return $this->read;
    }

    public function setRead(bool $read): self
    {
        $this->read = $read;
        
        if ($read && $this->readAt === null) {
            $this->readAt = new \DateTimeImmutable();
        }
        
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->readAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}
```

### Repository

```php
<?php

namespace App\Repository;

use App\Entity\Notification;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Doctrine\Persistence\ManagerRegistry;

class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /**
     * Get paginated notifications for a specific recipient
     */
    public function getNotificationsForRecipient(
        string $recipientType,
        int $recipientId,
        ?bool $readStatus = null,
        int $page = 1,
        int $limit = 15
    ): array {
        $qb = $this->createQueryBuilder('n')
            ->where('n.recipientType = :recipientType')
            ->andWhere('n.recipientId = :recipientId')
            ->setParameter('recipientType', $recipientType)
            ->setParameter('recipientId', $recipientId)
            ->orderBy('n.createdAt', 'DESC');

        if ($readStatus !== null) {
            $qb->andWhere('n.read = :readStatus')
               ->setParameter('readStatus', $readStatus);
        }

        $query = $qb->getQuery()
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $paginator = new Paginator($query);
        $totalItems = count($paginator);
        $totalPages = ceil($totalItems / $limit);

        return [
            'items' => $paginator->getIterator()->getArrayCopy(),
            'pagination' => [
                'total' => $totalItems,
                'page' => $page,
                'limit' => $limit,
                'pages' => $totalPages
            ]
        ];
    }

    /**
     * Count unread notifications for a specific recipient
     */
    public function countUnreadNotifications(string $recipientType, int $recipientId): int
    {
        return $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.recipientType = :recipientType')
            ->andWhere('n.recipientId = :recipientId')
            ->andWhere('n.read = :readStatus')
            ->setParameter('recipientType', $recipientType)
            ->setParameter('recipientId', $recipientId)
            ->setParameter('readStatus', false)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Mark all notifications as read for a specific recipient
     */
    public function markAllAsRead(string $recipientType, int $recipientId): int
    {
        $now = new \DateTimeImmutable();
        
        $result = $this->createQueryBuilder('n')
            ->update()
            ->set('n.read', ':read')
            ->set('n.readAt', ':readAt')
            ->where('n.recipientType = :recipientType')
            ->andWhere('n.recipientId = :recipientId')
            ->andWhere('n.read = :unread')
            ->setParameter('read', true)
            ->setParameter('readAt', $now)
            ->setParameter('recipientType', $recipientType)
            ->setParameter('recipientId', $recipientId)
            ->setParameter('unread', false)
            ->getQuery()
            ->execute();
            
        return $result;
    }
}
```

### Migration

```php
<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class VersionYYYYMMDDHHMMSS extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create notification table for persistent notifications';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notification (
            id INT AUTO_INCREMENT NOT NULL,
            type VARCHAR(50) NOT NULL,
            message VARCHAR(255) NOT NULL,
            related_entity_type VARCHAR(50) NOT NULL,
            related_entity_id INT NOT NULL,
            recipient_type VARCHAR(20) NOT NULL,
            recipient_id INT NOT NULL,
            `read` TINYINT(1) DEFAULT 0 NOT NULL,
            created_at DATETIME NOT NULL,
            read_at DATETIME DEFAULT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        
        $this->addSql('CREATE INDEX idx_notification_recipient ON notification (recipient_type, recipient_id, `read`)');
        $this->addSql('CREATE INDEX idx_notification_recipient_date ON notification (recipient_type, recipient_id, created_at)');
        $this->addSql('CREATE INDEX idx_notification_related_entity ON notification (related_entity_type, related_entity_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE notification');
    }
}
```

## Backend Implementation

### Updated NotificationService

```php
<?php

namespace App\Service;

use App\Entity\Notification;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Psr\Log\LoggerInterface;

class NotificationService
{
    public function __construct(
        private HubInterface $hub,
        private EntityManagerInterface $entityManager,
        private ?LoggerInterface $logger = null
    ) {}

    public function notifyNewOrder(int $orderId, int $restaurantId): bool
    {
        // Create notification data
        $data = [
            'type' => 'new_order',
            'orderId' => $orderId,
            'message' => 'New order received'
        ];
        
        // Persist notification in database
        $notification = new Notification();
        $notification->setType('new_order');
        $notification->setMessage('New order received');
        $notification->setRelatedEntityType('order');
        $notification->setRelatedEntityId($orderId);
        $notification->setRecipientType('restaurant');
        $notification->setRecipientId($restaurantId);
        
        $this->entityManager->persist($notification);
        $this->entityManager->flush();
        
        // Publish to Mercure hub
        $update = new Update(
            [
                "order/{$orderId}",
                "restaurant/{$restaurantId}/orders"
            ],
            json_encode($data)
        );

        try {
            $this->hub->publish($update);
            return true;
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Failed to publish new order notification to Mercure hub', [
                    'orderId' => $orderId,
                    'restaurantId' => $restaurantId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return false;
        }
    }

    public function notifyOrderStatusChange(int $orderId, int $userId, string $newStatus): bool
    {
        // Create notification data
        $data = [
            'type' => 'order_status_change',
            'orderId' => $orderId,
            'status' => $newStatus,
            'message' => "Order status changed to {$newStatus}"
        ];
        
        // Persist notification in database
        $notification = new Notification();
        $notification->setType('order_status_change');
        $notification->setMessage("Order status changed to {$newStatus}");
        $notification->setRelatedEntityType('order');
        $notification->setRelatedEntityId($orderId);
        $notification->setRecipientType('user');
        $notification->setRecipientId($userId);
        
        $this->entityManager->persist($notification);
        $this->entityManager->flush();
        
        // Publish to Mercure hub
        $update = new Update(
            [
                "order/{$orderId}",
                "user/{$userId}/orders"
            ],
            json_encode($data)
        );

        try {
            $this->hub->publish($update);
            return true;
        } catch (\Exception $e) {
            if ($this->logger) {
                $this->logger->error('Failed to publish order status change notification to Mercure hub', [
                    'orderId' => $orderId,
                    'userId' => $userId,
                    'status' => $newStatus,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return false;
        }
    }
}
```

### NotificationController

```php
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
        
        $user = $this->getUser();
        $recipientType = ($user instanceof User) ? 'user' : 'restaurant';
        $recipientId = ($user instanceof User) ? $user->getId() : $user->getId();
        
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
        $user = $this->getUser();
        $recipientType = ($user instanceof User) ? 'user' : 'restaurant';
        $recipientId = ($user instanceof User) ? $user->getId() : $user->getId();
        
        $count = $this->notificationRepository->countUnreadNotifications($recipientType, $recipientId);
        
        return $this->json(['count' => $count]);
    }

    #[Route('/{id}/read', name: 'app_notifications_mark_read', methods: ['PUT'])]
    public function markAsRead(Notification $notification): JsonResponse
    {
        $user = $this->getUser();
        $recipientType = ($user instanceof User) ? 'user' : 'restaurant';
        $recipientId = ($user instanceof User) ? $user->getId() : $user->getId();
        
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
                'read' => $notification->isRead(),
                'readAt' => $notification->getReadAt()
            ]
        ]);
    }

    #[Route('/read-all', name: 'app_notifications_mark_all_read', methods: ['PUT'])]
    public function markAllAsRead(): JsonResponse
    {
        $user = $this->getUser();
        $recipientType = ($user instanceof User) ? 'user' : 'restaurant';
        $recipientId = ($user instanceof User) ? $user->getId() : $user->getId();
        
        $count = $this->notificationRepository->markAllAsRead($recipientType, $recipientId);
        
        return $this->json([
            'success' => true,
            'count' => $count
        ]);
    }
}
```

## Frontend Integration

### Updated NotificationContext.jsx

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchDataFromEndpoint } from '../services/useApiService';

const NotificationContext = createContext();
const MERCURE_PUBLIC_URL = 'https://localhost/.well-known/mercure';

export const NotificationProvider = ({ children }) => {
  const { entity, isAuthenticated, token: apiToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [persistentNotifications, setPersistentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [mercureToken, setMercureToken] = useState(null);
  const [error, setError] = useState(null);

  // Function to add a formatted notification from real-time updates
  const addNotification = useCallback((data) => {
    let message = "Notification received.";
    if (data.message) {
      message = data.message;
    } else if (data.type === 'new_order' && data.orderId) {
      message = `New order #${data.orderId} received!`;
    } else if (data.type === 'status_update' && data.orderId && data.status) {
      message = `Order #${data.orderId} status changed to: ${data.status}`;
    } else if (data.orderId) {
      message = `Update for order #${data.orderId}.`;
    }
    
    // Create a unique ID for the notification for key prop and clearing
    const newNotification = { id: Date.now(), ...data, displayMessage: message };
    setNotifications(prev => [newNotification, ...prev]);

    // Optional: Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(message);
    }
    
    // Refresh unread count
    fetchUnreadCount();
  }, []);
  
  // Fetch persisted notifications from API
  const fetchNotifications = useCallback(async (page = 1, readStatus = null) => {
    if (!isAuthenticated() || !entity) return;
    
    setLoading(true);
    try {
      let url = `/api/notifications?page=${page}&limit=15`;
      if (readStatus !== null) {
        url += `&read=${readStatus}`;
      }
      
      const result = await fetchDataFromEndpoint(url, 'GET', null, true);
      setPersistentNotifications(result.items || []);
      setPagination(result.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Error fetching notifications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, entity]);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated() || !entity) return;
    
    try {
      const result = await fetchDataFromEndpoint('/api/notifications/unread-count', 'GET', null, true);
      setUnreadCount(result.count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isAuthenticated, entity]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetchDataFromEndpoint(`/api/notifications/${notificationId}/read`, 'PUT', null, true);
      
      // Update local state
      setPersistentNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Refresh unread count
      fetchUnreadCount();
      
      return true;
    } catch (err) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  }, [fetchUnreadCount]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetchDataFromEndpoint('/api/notifications/read-all', 'PUT', null, true);
      
      // Update local state
      setPersistentNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  }, []);

  // Fetch Mercure token
  useEffect(() => {
    const fetchMercureToken = async () => {
      if (isAuthenticated() && entity && !mercureToken && apiToken) {
        try {
          setError(null);
          const tokenData = await fetchDataFromEndpoint('/auth/mercure_token', 'GET', null, true);
          if (tokenData && tokenData.mercureToken) {
            setMercureToken(tokenData.mercureToken);
          } else {
            console.error("Failed to fetch Mercure token or token not in response");
            setError("Failed to fetch Mercure token.");
          }
        } catch (err) {
          console.error("Error fetching Mercure token:", err);
          setError(err.message || "Error fetching Mercure token.");
        }
      }
    };

    fetchMercureToken();
  }, [isAuthenticated, entity, apiToken, mercureToken]);

  // Initialize Mercure connection
  useEffect(() => {
    if (!isAuthenticated() || !entity || !mercureToken) {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
        console.log("Mercure EventSource closed due to logout, missing entity, or missing token.");
      }
      return;
    }

    // Determine topics to subscribe to based on user type
    let topics = [];
    if (entity.roles?.includes('ROLE_RESTAURANT') && entity.restaurantId) {
      topics.push(`/orders/restaurant/${entity.restaurantId}`);
    } else if (entity.roles?.includes('ROLE_USER') && entity.userId) {
      topics.push(`/orders/user/${entity.userId}`);
    }

    if (topics.length === 0) {
      console.log("No relevant Mercure topics to subscribe to for the current entity:", entity);
      return;
    }

    // Create URL with topics
    const url = new URL(MERCURE_PUBLIC_URL);
    topics.forEach(topic => url.searchParams.append('topic', topic));
    
    console.log("Subscribing to Mercure URL:", url.toString());
    
    // Set the cookie with the JWT token for Mercure authorization
    document.cookie = `mercureAuthorization=${mercureToken}; path=/.well-known/mercure; secure; samesite=strict`;
    
    // Create standard EventSource
    const es = new EventSource(url);

    es.onopen = () => {
      console.log("Mercure EventSource connection established.");
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Mercure message received:", data);
        addNotification(data);
      } catch (e) {
        console.error("Failed to parse Mercure message data:", event.data, e);
        addNotification({ message: "Received an invalid update." });
      }
    };

    es.onerror = (error) => {
      console.error('Mercure EventSource failed:', error);
      if (error.target && error.target.readyState === EventSource.CLOSED) {
        setError('Mercure connection closed. Attempting to reconnect or token might be expired.');
      } else {
        setError('Mercure connection error.');
      }
    };

    setEventSource(es);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (es) {
        es.close();
        setEventSource(null);
        console.log("Mercure EventSource closed on component unmount or dependency change.");
      }
    };
  }, [entity, isAuthenticated, mercureToken, addNotification, apiToken]);

  // Initial fetch of notifications and unread count
  useEffect(() => {
    if (isAuthenticated() && entity) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, entity, fetchNotifications, fetchUnreadCount]);

  // Clear temporary (toast) notification
  const clearNotification = (idToClear) => {
    setNotifications(prev => prev.filter(n => n.id !== idToClear));
  };
  
  // Clear all temporary (toast) notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    // Real-time toast notifications
    notifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
    
    // Persistent notifications
    persistentNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
    pagination,
    loading,
    
    // Errors
    mercureError: error
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
```

### NotificationBell Component

```jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FaBell } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
  const { 
    persistentNotifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    loading 
  } = useNotifications();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewingUnread, setViewingUnread] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the related entity
    if (notification.relatedEntityType === 'order' && notification.relatedEntityId) {
      navigate(`/orders/${notification.relatedEntityId}`);
      setDropdownOpen(false);
    }
  };
  
  // Toggle between unread and all notifications
  const toggleView = () => {
    setViewingUnread(!viewingUnread);
    fetchNotifications(1, viewingUnread ? null : false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="btn btn-ghost btn-circle"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="indicator">
          <FaBell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="indicator-item badge badge-primary badge-sm">{unreadCount}</span>
          )}
        </div>
      </button>
      
      {dropdownOpen && (
        <div className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-80 absolute right-0 mt-2">
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-bold">
              {viewingUnread ? "Unread Notifications" : "All Notifications"}
            </h3>
            <div className="flex gap-2">
              <button 
                className="btn btn-xs btn-ghost" 
                onClick={toggleView}
              >
                {viewingUnread ? "View All" : "View Unread"}
              </button>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-xs btn-primary" 
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : persistentNotifications.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No {viewingUnread ? "unread " : ""}notifications
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {persistentNotifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-2 mb-1 rounded cursor-pointer hover:bg-base-200 
                    ${notification.read ? 'opacity-70' : 'font-semibold bg-base-200'}
                  `}
                >
                  <div className="flex justify-between">
                    <span className="text-sm">{notification.message}</span>
                    <span className="text-xs opacity-50">
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {notification.relatedEntityType === 'order' && (
                    <div className="text-xs text-primary">
                      Click to view order #{notification.relatedEntityId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

## Performance Considerations

### Database Indexes

The migration includes the following indexes to ensure optimal query performance:

1. Primary Key index on `id`
2. Composite index on `(recipientType, recipientId, read)` - Used for efficiently querying unread notifications for a specific recipient
3. Composite index on `(recipientType, recipientId, createdAt)` - Used for chronologically sorting a recipient's notifications
4. Index on `(relatedEntityType, relatedEntityId)` - Used for lookups related to specific entities

### Pagination

The notification repository implements pagination with a default of 15 notifications per page. This ensures:

1. Reduced database load when querying large notification collections
2. Improved frontend performance by limiting the number of notifications rendered at once
3. Better user experience with faster initial load times

### Batch Operations

For operations like marking all notifications as read, we use DQL update queries directly in the repository rather than loading, modifying, and saving each notification individually. This approach:

1. Reduces database round trips
2. Improves performance for bulk operations
3. Reduces memory consumption on the server

### Security Considerations

1. The NotificationController is secured with `IsGranted('IS_AUTHENTICATED_FULLY')` to ensure only authenticated users can access notifications.
2. Additional checks ensure users can only view and modify their own notifications.
3. All database queries include recipient filtering to prevent information leakage.

## Implementation Sequence

1. Create the Notification entity and repository
2. Run the database migration
3. Update the NotificationService to persist notifications
4. Create the NotificationController with API endpoints
5. Implement the NotificationBell component in the frontend
6. Update the NotificationContext to work with persistent notifications
7. Add the NotificationBell to the header

---

This implementation plan provides a comprehensive approach to adding persistent notifications to the BeruFoods application, ensuring notifications are stored in the database, can be marked as read, and are accessible through a bell icon in the header.