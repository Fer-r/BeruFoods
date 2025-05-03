<?php

namespace App\Repository;

use App\Entity\Reservation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\Restaurant;
use DateTimeInterface;
use DateTimeImmutable;

/**
 * @extends ServiceEntityRepository<Reservation>
 */
class ReservationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reservation::class);
    }

    /**
     * Finds reservations for a specific restaurant on a given date.
     *
     * @param Restaurant $restaurant
     * @param DateTimeInterface $date
     * @return Reservation[]
     */
    public function findReservationsForDate(Restaurant $restaurant, DateTimeInterface $date): array
    {
        // Create new immutable objects for start and end of the day
        $dateStr = $date->format('Y-m-d');
        $startOfDay = new DateTimeImmutable($dateStr . ' 00:00:00');
        $endOfDay = new DateTimeImmutable($dateStr . ' 23:59:59');

        return $this->createQueryBuilder('r')
            ->andWhere('r.restaurant = :restaurant')
            ->andWhere('r.reservation_time >= :startOfDay')
            ->andWhere('r.reservation_time <= :endOfDay')
            ->setParameter('restaurant', $restaurant)
            ->setParameter('startOfDay', $startOfDay)
            ->setParameter('endOfDay', $endOfDay)
            ->orderBy('r.reservation_time', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Finds reservations for a specific restaurant within a given date range.
     *
     * @param Restaurant $restaurant
     * @param DateTimeInterface $startDate
     * @param DateTimeInterface $endDate
     * @return Reservation[]
     */
    public function findReservationsForDateRange(Restaurant $restaurant, DateTimeInterface $startDate, DateTimeInterface $endDate): array
    {
        // Ensure time components cover the entire start and end dates using immutable objects
        $startStr = $startDate->format('Y-m-d');
        $endStr = $endDate->format('Y-m-d');
        $start = new DateTimeImmutable($startStr . ' 00:00:00');
        $end = new DateTimeImmutable($endStr . ' 23:59:59');

        return $this->createQueryBuilder('r')
            ->andWhere('r.restaurant = :restaurant')
            ->andWhere('r.reservation_time BETWEEN :start AND :end')
            ->setParameter('restaurant', $restaurant)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('r.reservation_time', 'ASC') // Keep order for potential grouping later
            ->getQuery()
            ->getResult();
    }
} 