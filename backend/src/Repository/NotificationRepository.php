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
            $qb->andWhere('n.isRead = :readStatus')
               ->setParameter('readStatus', $readStatus);
        }

        $query = $qb->getQuery()
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $paginator = new Paginator($query);
        $totalItems = count($paginator);
        $totalPages = ceil($totalItems / $limit);

        return [
            'items' => iterator_to_array($paginator->getIterator()),
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
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.recipientType = :recipientType')
            ->andWhere('n.recipientId = :recipientId')
            ->andWhere('n.isRead = :readStatus')
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
            ->set('n.isRead', ':read')
            ->set('n.readAt', ':readAt')
            ->where('n.recipientType = :recipientType')
            ->andWhere('n.recipientId = :recipientId')
            ->andWhere('n.isRead = :unread')
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