<?php

namespace App\Repository;

use App\Entity\Restaurant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Restaurant>
 */
class RestaurantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Restaurant::class);
    }

    //    /**
    //     * @return Restaurant[] Returns an array of Restaurant objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('r')
    //            ->andWhere('r.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('r.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Restaurant
    //    {
    //        return $this->createQueryBuilder('r')
    //            ->andWhere('r.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    /**
     * Finds restaurants within a given radius of a latitude/longitude point.
     *
     * NOTE: This DQL requires a spatial Doctrine extension (like jsor/doctrine-postgis)
     * and configuration for the ST_Distance_Sphere function (or equivalent for your DB).
     * The `a.point` assumes a POINT geometry field exists on RestaurantAddress.
     * Adjust field names and function calls based on your specific setup.
     *
     * @param float $latitude
     * @param float $longitude
     * @param int $radiusMeters
     * @param int|null $foodTypeId Optional food type ID to filter by
     * @return Restaurant[]
     */
    public function findNearby(float $latitude, float $longitude, int $radiusMeters = 5000, ?int $foodTypeId = null): array
    {
        $qb = $this->createQueryBuilder('r')
            ->innerJoin('r.address', 'a')
            ->addSelect('a') // Select address data too
            // Example using ST_Distance_Sphere (PostGIS) - adapt function/syntax for your DB
            // Requires a POINT field on Address entity named 'point' containing SRID 4326 coordinates
            // ->andWhere('ST_Distance_Sphere(a.point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) <= :radius')

            // --- Alternative using separate lat/lng columns (less efficient) ---
            // This uses Haversine formula approximation in DQL. More complex and potentially slower.
            // Requires defining 'lat' and 'lng' fields on RestaurantAddress.
            ->addSelect('( 6371000 * acos( cos( radians(:lat) ) * cos( radians( a.lat ) ) * cos( radians( a.lng ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( a.lat ) ) ) ) AS distance')
            ->andWhere('( 6371000 * acos( cos( radians(:lat) ) * cos( radians( a.lat ) ) * cos( radians( a.lng ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( a.lat ) ) ) ) <= :radius')
            ->having('distance <= :radius') // Use having if distance is calculated in SELECT
            ->orderBy('distance', 'ASC')
            // --- End Alternative ---

            ->setParameter('lat', $latitude)
            ->setParameter('lng', $longitude)
            ->setParameter('radius', $radiusMeters);

        // Add food type filter if provided
        if ($foodTypeId !== null) {
            $qb->innerJoin('r.foodTypes', 'ft')
               ->andWhere('ft.id = :foodTypeId')
               ->setParameter('foodTypeId', $foodTypeId);
        }

        // If using the POINT field approach without distance in select, remove having() and orderBy('distance')
        // You might add a simple orderBy like ->orderBy('r.name', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @param float $longitude
     * @param int $radiusMeters
     * @param int|null $foodTypeId Optional food type ID to filter by
     * @return \Doctrine\ORM\QueryBuilder The QueryBuilder object for further customization (e.g., pagination)
     */
    public function findNearbyQueryBuilder(float $latitude, float $longitude, int $radiusMeters = 5000, ?int $foodTypeId = null): \Doctrine\ORM\QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->innerJoin('r.address', 'a')
            // Note: Select the main entity and potentially calculated fields like distance
            // Address and FoodType might need separate joins/selects if needed after pagination
            ->addSelect('( 6371000 * acos( cos( radians(:lat) ) * cos( radians( a.lat ) ) * cos( radians( a.lng ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( a.lat ) ) ) ) AS HIDDEN distance') // Calculate distance, mark as HIDDEN if not needed directly in entity hydration
            ->andWhere('( 6371000 * acos( cos( radians(:lat) ) * cos( radians( a.lat ) ) * cos( radians( a.lng ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( a.lat ) ) ) ) <= :radius')
            // ->having('distance <= :radius') // Using HAVING with Paginator can be tricky/inefficient. Prefer WHERE if possible.
            ->orderBy('distance', 'ASC') // Order by distance
            ->setParameter('lat', $latitude)
            ->setParameter('lng', $longitude)
            ->setParameter('radius', $radiusMeters);

        if ($foodTypeId !== null) {
            $qb->innerJoin('r.foodTypes', 'ft') // Join necessary for filtering
               ->andWhere('ft.id = :foodTypeId')
               ->setParameter('foodTypeId', $foodTypeId);
        }

        return $qb; // Return the QueryBuilder object
    }

    // Keep the old findNearby method temporarily if needed, or remove it.
    // public function findNearby(...) { ... ->getQuery()->getResult(); }
}
