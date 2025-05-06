<?php

namespace App\Controller;

use App\Entity\Restaurant;
use App\Repository\RestaurantRepository;
use App\Repository\FoodTypeRepository; // For handling food types update
use App\Entity\FoodType; // For type hinting
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface; // Needed if password can be updated
use Doctrine\Common\Collections\ArrayCollection; // Added ArrayCollection
use Doctrine\ORM\Tools\Pagination\Paginator; // Import Paginator
use App\Repository\ReservationRepository; // Import ReservationRepository
use DateTimeImmutable; // Import DateTimeImmutable
use DateTimeInterface; // Import DateTimeInterface
use DateInterval; // Import DateInterval
use DatePeriod; // Import DatePeriod
use Symfony\Component\HttpFoundation\File\UploadedFile; // For file uploads
use Symfony\Component\HttpFoundation\File\Exception\FileException; // Import FileException
use Symfony\Component\String\Slugger\SluggerInterface; // To generate safe filenames
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface; // To access config params
use Symfony\Component\Filesystem\Filesystem; // To delete old files

#[Route('/api/restaurants')]
final class RestaurantController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10;

    public function __construct(private ParameterBagInterface $params) {}

    #[Route('', name: 'api_restaurant_index', methods: ['GET'])]
    public function index(RestaurantRepository $restaurantRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

        $latitude = $request->query->get('latitude');
        $longitude = $request->query->get('longitude');
        $radius = $request->query->get('radius', 5000);
        $foodTypeIdsParam = $request->query->get('foodTypeId');
        $name = $request->query->get('name'); // Get name parameter
        $isOpenNow = $request->query->getBoolean('isOpenNow', false); // New parameter

        $qb = null; // Initialize QueryBuilder variable

        // Convert comma-separated foodTypeId string to array of integers
        $foodTypeIds = null;
        if ($foodTypeIdsParam) {
            $foodTypeIds = array_map('intval', explode(',', $foodTypeIdsParam));
        }

        if ($latitude !== null && $longitude !== null) {
            // Nearby search
            if (!is_numeric($latitude) || !is_numeric($longitude) || !is_numeric($radius)) {
                return $this->json(['message' => 'Invalid coordinates or radius'], Response::HTTP_BAD_REQUEST);
            }
            // Use the QueryBuilder method
            $qb = $restaurantRepository->findNearbyQueryBuilder(
                (float)$latitude,
                (float)$longitude,
                (int)$radius,
                $foodTypeIds // Pass the array of IDs
            );
            // Paginator will be applied below
            // Add name filtering for nearby search if provided
            if ($name) {
                $qb->andWhere('LOWER(r.name) LIKE LOWER(:name)')
                   ->setParameter('name', '%' . $name . '%');
            }

        } else {
            // Standard QB filtering (no pagination applied here yet)
            $qb = $restaurantRepository->createQueryBuilder('r')
                ->innerJoin('r.address', 'a')->addSelect('a')
                ->innerJoin('r.foodTypes', 'ft')->addSelect('ft');

            if (!empty($foodTypeIds)) { // Check if the array is not empty
                $qb->andWhere($qb->expr()->in('ft.id', ':foodTypeIds')) // Use IN clause
                   ->setParameter('foodTypeIds', $foodTypeIds); // Pass the array of IDs
            }

            // Add name filtering if provided
            if ($name) {
                $qb->andWhere('LOWER(r.name) LIKE LOWER(:name)')
                   ->setParameter('name', '%' . $name . '%');
            }

            // Add other non-spatial filters here
            $qb->orderBy('r.name', 'ASC'); // Set default order for non-nearby
        }

        // Apply "isOpenNow" filter if requested
        if ($isOpenNow) {
            $qb->andWhere(
                $qb->expr()->orX(
                    // Case 1: Not overnight (opening_time <= closing_time)
                    // AND current_time BETWEEN opening_time AND closing_time
                    $qb->expr()->andX(
                        'r.openingTime <= r.closingTime',
                        'r.openingTime <= CURRENT_TIME()',
                        'r.closingTime >= CURRENT_TIME()'
                    ),
                    // Case 2: Overnight (opening_time > closing_time)
                    // AND (current_time >= opening_time OR current_time <= closing_time)
                    $qb->expr()->andX(
                        'r.openingTime > r.closingTime',
                        $qb->expr()->orX(
                            'r.openingTime <= CURRENT_TIME()',
                            'r.closingTime >= CURRENT_TIME()'
                        )
                    )
                )
            );
        }

        // Apply pagination to the selected QueryBuilder
        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $paginator = new Paginator($qb->getQuery(), true); // Fetch joins is true by default
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);

        $results = iterator_to_array($paginator->getIterator());

        // Get base path for images
        $imageBasePath = $this->params->get('restaurant_images_public_path');

        // Add imageUrl to each result
        $processedResults = [];
        foreach ($results as $restaurant) {
            // Assuming $restaurant is an object with getImageFilename()
            $filename = $restaurant->getImageFilename();
            $imageUrl = $filename ? rtrim($imageBasePath, '/') . '/' . $filename : null;
            // We need to serialize the restaurant first to add the URL
            // Serialize individual restaurant with appropriate group
             $restaurantData = json_decode($serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read:collection']), true);
             $restaurantData['imageUrl'] = $imageUrl;

             // Format opening and closing times
             if ($restaurant->getOpeningTime()) {
                 $restaurantData['openingTime'] = $restaurant->getOpeningTime()->format('H:i');
             }
             if ($restaurant->getClosingTime()) {
                 $restaurantData['closingTime'] = $restaurant->getClosingTime()->format('H:i');
             }

             $processedResults[] = $restaurantData;
        }

        // Prepare response data with processed results
        $data = [
            'items' => $processedResults, // Use processed results
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        // Note: The calculated 'distance' is marked as HIDDEN in the QB.
        // To include it in the response, you'd need to adjust the QB select,
        // potentially use a DTO, or add it manually after serialization if feasible.

        // Serialize the final data structure (pagination + items with imageUrl)
        $json = json_encode($data); // Data is already structured correctly
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_restaurant_show', methods: ['GET'])]
    public function show(Restaurant $restaurant, SerializerInterface $serializer): JsonResponse
    {
        // Serialize the restaurant object
        $json = $serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read']);

        // Decode the JSON to an array to add the image URL
        $data = json_decode($json, true);

        // Get base path for images
        $imageBasePath = $this->params->get('restaurant_images_public_path');

        // Construct and add the image URL
        $filename = $restaurant->getImageFilename();
        $data['imageUrl'] = $filename ? rtrim($imageBasePath, '/') . '/' . $filename : null;

        // Format opening and closing times for the single restaurant view
        if ($restaurant->getOpeningTime()) {
            $data['openingTime'] = $restaurant->getOpeningTime()->format('H:i');
        } else {
            // Ensure the key exists even if null, if the frontend expects it
            $data['openingTime'] = null;
        }

        if ($restaurant->getClosingTime()) {
            $data['closingTime'] = $restaurant->getClosingTime()->format('H:i');
        } else {
            // Ensure the key exists even if null
            $data['closingTime'] = null;
        }

        // Return the modified data as JSON
        return new JsonResponse($data, Response::HTTP_OK); // Already an array, no need for json_encode or third param true
    }

    #[Route('/{id}', name: 'api_restaurant_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('edit', 'restaurant')] // Assumes RestaurantVoter for ownership check
    public function update(
        Request $request,
        Restaurant $restaurant,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        FoodTypeRepository $foodTypeRepository, // Inject to handle food types
        UserPasswordHasherInterface $passwordHasher, // Needed for password update
        SluggerInterface $slugger,                  // Inject Slugger
        Filesystem $filesystem                  // Inject Filesystem
    ): JsonResponse {
        $this->denyAccessUnlessGranted('edit', $restaurant); // Check ownership or ROLE_ADMIN via Voter

        $originalFoodTypes = new ArrayCollection();
        foreach ($restaurant->getFoodTypes() as $foodType) {
            $originalFoodTypes->add($foodType);
        }

        // Deserialize basic fields onto existing object
        $serializer->deserialize($request->getContent(), Restaurant::class, 'json', [
            AbstractNormalizer::OBJECT_TO_POPULATE => $restaurant,
            AbstractNormalizer::IGNORED_ATTRIBUTES => ['password', 'foodTypes'] // Handle separately
        ]);

        $data = json_decode($request->getContent(), true) ?? []; // Decode JSON data, default to empty array if null

        // Handle Image Upload
        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile'); // Key used in FormData
        $uploadDirectory = $this->params->get('restaurant_images_directory'); // Get upload dir from config

        if ($imageFile) {
            // Basic validation (you might want more robust validation)
            if (!in_array($imageFile->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
                return $this->json(['errors' => ['imageFile' => 'Invalid file type. Only JPG, PNG, GIF allowed.']], Response::HTTP_BAD_REQUEST);
            }
            if ($imageFile->getSize() > 5 * 1024 * 1024) { // 5MB limit
                return $this->json(['errors' => ['imageFile' => 'File is too large. Max 5MB allowed.']], Response::HTTP_BAD_REQUEST);
        }

            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename.'-'.uniqid().'.'.$imageFile->guessExtension();

            try {
                // Delete old file if it exists
                $oldFilename = $restaurant->getImageFilename();
                if ($oldFilename) {
                    $filesystem->remove($uploadDirectory.'/'.$oldFilename);
                }

                // Move the new file to the target directory
                $imageFile->move($uploadDirectory, $newFilename);
                $restaurant->setImageFilename($newFilename); // Update entity
            } catch (FileException $e) {
                // Handle file upload error (e.g., log it)
                 return $this->json(['errors' => ['imageFile' => 'Failed to upload image.'.$e->getMessage()]], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        // Handle password update separately
        if (isset($data['password']) && !empty($data['password'])) {
             if (strlen($data['password']) >= 6) {
                 $hashedPassword = $passwordHasher->hashPassword($restaurant, $data['password']);
                 $restaurant->setPassword($hashedPassword);
             } else {
                 return $this->json(['errors' => ['password' => ['Password must be at least 6 characters long']]], Response::HTTP_BAD_REQUEST);
        }
        }

        // Handle FoodTypes update (example assumes array of IDs)
        if (isset($data['food_type_ids']) && is_array($data['food_type_ids'])) {
            // Remove old ones
            foreach ($originalFoodTypes as $foodType) {
                if (!in_array($foodType->getId(), $data['food_type_ids'])) {
                    $restaurant->removeFoodType($foodType);
                }
            }
            // Add new ones
            foreach ($data['food_type_ids'] as $foodTypeId) {
                $foodType = $foodTypeRepository->find($foodTypeId);
                if ($foodType && !$restaurant->getFoodTypes()->contains($foodType)) {
                    $restaurant->addFoodType($foodType);
                }
            }
        }

        // TODO: Handle Address update/creation if needed

        $errors = $validator->validate($restaurant);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}', name: 'api_restaurant_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')] // Only Admins can delete restaurants
    public function delete(Restaurant $restaurant, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($restaurant);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/ban', name: 'api_restaurant_ban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function ban(Restaurant $restaurant, EntityManagerInterface $entityManager): JsonResponse
    {
        $restaurant->setBanned(true);
        $entityManager->flush();
        return new JsonResponse(['message' => 'Restaurant banned successfully.'], Response::HTTP_OK);
    }

    #[Route('/{id}/unban', name: 'api_restaurant_unban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function unban(Restaurant $restaurant, EntityManagerInterface $entityManager): JsonResponse
    {
        $restaurant->setBanned(false);
        $entityManager->flush();
        return new JsonResponse(['message' => 'Restaurant unbanned successfully.'], Response::HTTP_OK);
    }

    #[Route('/{id}/availability', name: 'api_restaurant_availability', methods: ['GET'])]
    public function getAvailability(
        Restaurant $restaurant,
        Request $request,
        ReservationRepository $reservationRepository
    ): JsonResponse {
        // Get startDate and endDate from query parameters
        $startDateString = $request->query->get('startDate'); // Expecting YYYY-MM-DD format
        $endDateString = $request->query->get('endDate');     // Expecting YYYY-MM-DD format

        if (!$startDateString || !$endDateString) {
            return $this->json(['message' => 'startDate and endDate query parameters are required.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $startDate = new DateTimeImmutable($startDateString);
            $endDate = new DateTimeImmutable($endDateString);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Invalid date format. Please use YYYY-MM-DD for startDate and endDate.'], Response::HTTP_BAD_REQUEST);
        }

        // Basic validation: endDate should not be before startDate
        if ($endDate < $startDate) {
            return $this->json(['message' => 'endDate cannot be before startDate.'], Response::HTTP_BAD_REQUEST);
        }

        // Optional: Limit the date range (e.g., to 31 days) to prevent large requests
        $dateDiff = $endDate->diff($startDate);
        if ($dateDiff->days > 31) { // Example limit
            return $this->json(['message' => 'Date range cannot exceed 31 days.'], Response::HTTP_BAD_REQUEST);
    }

        // Basic checks: ensure restaurant exists and is not banned
        if ($restaurant->isBanned()) {
            return $this->json(['message' => 'This restaurant is currently unavailable.'], Response::HTTP_FORBIDDEN);
        }

        $openingTime = $restaurant->getOpeningTime();
        $closingTime = $restaurant->getClosingTime();
        $reservationDuration = $restaurant->getReservationDuration();

        if (!$openingTime || !$closingTime || $reservationDuration === null || $reservationDuration <= 0) {
            return $this->json(['message' => 'Restaurant schedule information is incomplete or invalid.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Format opening/closing times once
        $openingTimeStr = $openingTime->format('H:i:s');
        $closingTimeStr = $closingTime->format('H:i:s');

        // Fetch all reservations for the entire range at once
        $allReservations = $reservationRepository->findReservationsForDateRange($restaurant, $startDate, $endDate);
        $reservationsByDate = [];
        foreach ($allReservations as $reservation) {
            // Use the correct getter method: getReservationDatetime()
            $dateTime = $reservation->getReservationDatetime();
            if ($dateTime === null) continue; // Skip if datetime is null for some reason

            $dateKey = $dateTime->format('Y-m-d');
            $timeKey = $dateTime->format('H:i');
            $reservationsByDate[$dateKey][$timeKey] = true; // Store reserved slots efficiently
        }

        $availableDates = [];
        $interval = new DateInterval('P1D'); // 1 day interval
        // Include end date in the period
        $datePeriod = new DatePeriod($startDate, $interval, $endDate->add($interval));

        $slotInterval = new \DateInterval('PT' . $reservationDuration . 'M');

        foreach ($datePeriod as $currentDate) {
            $dateKey = $currentDate->format('Y-m-d');
            $reservedSlotsToday = $reservationsByDate[$dateKey] ?? []; // Get reservations for this specific day

            // Check if any slot is available for this day
            $slotTime = DateTimeImmutable::createFromFormat('!H:i:s', $openingTimeStr); // Use '!' to avoid timezone changes
            $closingDateTime = DateTimeImmutable::createFromFormat('!H:i:s', $closingTimeStr);

            $dayHasAvailability = false;
            while ($slotTime < $closingDateTime) {
                $slotTimeStr = $slotTime->format('H:i');
                if (!isset($reservedSlotsToday[$slotTimeStr])) {
                    $dayHasAvailability = true;
                    break; // Found an available slot, no need to check further for this day
                }
                $slotTime = $slotTime->add($slotInterval);
            }

            if ($dayHasAvailability) {
                $availableDates[] = $dateKey; // Add date string YYYY-MM-DD
            }
        }

        return $this->json(['available_dates' => $availableDates], Response::HTTP_OK);
    }
} 