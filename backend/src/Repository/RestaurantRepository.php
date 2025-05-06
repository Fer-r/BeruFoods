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
     * @param int|null $foodTypeIds Optional array of food type IDs to filter by
     * @return Restaurant[]
     */
    public function findNearby(float $latitude, float $longitude, int $radiusMeters = 5000, ?array $foodTypeIds = null): array
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
        if ($foodTypeIds !== null && !empty($foodTypeIds)) {
            $qb->innerJoin('r.foodTypes', 'ft')
               ->andWhere($qb->expr()->in('ft.id', ':foodTypeIds'))
               ->setParameter('foodTypeIds', $foodTypeIds);
        }

        // If using the POINT field approach without distance in select, remove having() and orderBy('distance')
        // You might add a simple orderBy like ->orderBy('r.name', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @param float $longitude
     * @param int $radiusMeters
     * @param array|null $foodTypeIds Optional array of food type IDs to filter by
     * @return \Doctrine\ORM\QueryBuilder The QueryBuilder object for further customization (e.g., pagination)
     */
    public function findNearbyQueryBuilder(float $latitude, float $longitude, int $radiusMeters = 5000, ?array $foodTypeIds = null): \Doctrine\ORM\QueryBuilder
    {
        $earthRadius = 6371000; // meters

        // Calculate bounding box coordinates
        $latRadiusDegrees = rad2deg($radiusMeters / $earthRadius);
        // Ensure cos(deg2rad($latitude)) is not zero to avoid division by zero if latitude is +/- 90 degrees
        $cosLat = cos(deg2rad($latitude));
        if ($cosLat == 0) {
            // At poles, longitude radius is effectively infinite or not well-defined in this simple model.
            // Fallback to a very large longitude span or handle as a special case if needed.
            // For simplicity here, we might just use a large number or not apply longitude bounding.
            // However, a restaurant search at the exact pole is unlikely.
            // A more robust solution might skip longitude bounding or use a different projection near poles.
            $lngRadiusDegrees = 180; // Effectively no longitude bounding for this simple case
        } else {
            $lngRadiusDegrees = rad2deg($radiusMeters / $earthRadius / $cosLat);
        }

        $minLat = $latitude - $latRadiusDegrees;
        $maxLat = $latitude + $latRadiusDegrees;
        $minLng = $longitude - $lngRadiusDegrees;
        $maxLng = $longitude + $lngRadiusDegrees;

        $qb = $this->createQueryBuilder('r')
            ->innerJoin('r.address', 'a');

        // Add bounding box for initial filtering (can use an index if lat/lng are indexed)
        $qb->andWhere('a.lat BETWEEN :minLat AND :maxLat')
           ->andWhere('a.lng BETWEEN :minLng AND :maxLng');

        // Precise distance calculation using Haversine (ASIN variant from your example)
        // This is calculated for rows that pass the bounding box.
        $distanceFormula = '(:earthRadius * 2 * ASIN(SQRT(POWER(SIN(RADIANS(a.lat - :lat) / 2), 2) + COS(RADIANS(:lat)) * COS(RADIANS(a.lat)) * POWER(SIN(RADIANS(a.lng - :lng) / 2), 2))))';

        $qb->addSelect($distanceFormula . ' AS HIDDEN distance') // Calculate distance, mark as HIDDEN
           ->andWhere($distanceFormula . ' <= :radius')         // Filter by the calculated distance
           ->orderBy('distance', 'ASC');                         // Order by distance

        $qb->setParameter('lat', $latitude);
        $qb->setParameter('lng', $longitude);
        $qb->setParameter('radius', $radiusMeters);
        $qb->setParameter('earthRadius', $earthRadius);
        $qb->setParameter('minLat', $minLat);
        $qb->setParameter('maxLat', $maxLat);
        $qb->setParameter('minLng', $minLng);
        $qb->setParameter('maxLng', $maxLng);

        if ($foodTypeIds !== null && !empty($foodTypeIds)) {
            $qb->innerJoin('r.foodTypes', 'ft')
               ->andWhere($qb->expr()->in('ft.id', ':foodTypeIds'))
               ->setParameter('foodTypeIds', $foodTypeIds);
        }
        
        return $qb; // Return the QueryBuilder object
    }

}
