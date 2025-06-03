<?php

namespace App\Controller;

use App\Entity\Restaurant;
use App\Entity\RestaurantAddress; // Added import
use App\Repository\RestaurantRepository;
use App\Repository\FoodTypeRepository; // For handling food types update
use App\Entity\FoodType; // For type hinting
use App\Service\ImageUploader;
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
use Symfony\Component\Validator\Constraints as Assert; // Import the Image constraint
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
    private const MAX_ITEMS_PER_PAGE = 100;
    private const DEFAULT_RADIUS = 5000;
    private const MAX_RADIUS = 50000;

    public function __construct(private ImageUploader $imageUploader) {}

    #[Route('', name: 'api_restaurant_index', methods: ['GET'])]
    public function index(RestaurantRepository $restaurantRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $requestedLimit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);
        $limit = min($requestedLimit, self::MAX_ITEMS_PER_PAGE);

        $latitude = $request->query->get('latitude');
        $longitude = $request->query->get('longitude');
        $requestedRadius = $request->query->get('radius', self::DEFAULT_RADIUS);
        $radius = min((int)$requestedRadius, self::MAX_RADIUS);

        $foodTypeIdsParam = $request->query->get('foodTypeId');
        $name = $request->query->get('name'); // Get name parameter
        $isOpenNow = $request->query->getBoolean('isOpenNow', false); // New parameter

        $qb = null;

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

        $processedResults = [];
        foreach ($results as $restaurant) {
            $filename = $restaurant->getImageFilename();
            $imageUrl = $this->imageUploader->getImageUrl($filename);
            $restaurantData = json_decode($serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read:collection']), true);
            $restaurantData['imageUrl'] = $imageUrl;

            if ($restaurant->getOpeningTime()) {
                $restaurantData['openingTime'] = $restaurant->getOpeningTime()->format('H:i');
            }
            if ($restaurant->getClosingTime()) {
                $restaurantData['closingTime'] = $restaurant->getClosingTime()->format('H:i');
            }

            $processedResults[] = $restaurantData;
        }

        $data = [
            'items' => $processedResults,
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'api_restaurant_show', methods: ['GET'])]
    public function show(Restaurant $restaurant, SerializerInterface $serializer): JsonResponse
    {
        $json = $serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read']);
        $data = json_decode($json, true);

        $filename = $restaurant->getImageFilename();
        $data['imageUrl'] = $this->imageUploader->getImageUrl($filename);

        if ($restaurant->getOpeningTime()) {
            $data['openingTime'] = $restaurant->getOpeningTime()->format('H:i');
        } else {
            $data['openingTime'] = null;
        }

        if ($restaurant->getClosingTime()) {
            $data['closingTime'] = $restaurant->getClosingTime()->format('H:i');
        } else {
            $data['closingTime'] = null;
        }

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'api_restaurant_update', methods: ['PUT', 'PATCH', 'POST'])]
    #[IsGranted('edit', 'restaurant')]
    public function update(
        Request $request,
        Restaurant $restaurant,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        FoodTypeRepository $foodTypeRepository,
        UserPasswordHasherInterface $passwordHasher,
        SerializerInterface $serializer // Added for potential 200 OK response with entity
    ): JsonResponse {
        error_log('--- RESTAURANT UPDATE ACTION ---');
        error_log('Request Method: ' . $request->getMethod());
        error_log('Content-Type: ' . $request->headers->get('Content-Type'));
        error_log('Request Query Parameters: ' . print_r($request->query->all(), true));
        error_log('Request Request Parameters (parsed body): ' . print_r($request->request->all(), true));
        error_log('Request Files: ' . print_r($request->files->all(), true));
        $content = $request->getContent();
        error_log('Request Raw Content (first 1000 chars): ' . substr($content, 0, 1000));
        $contentType = $request->headers->get('Content-Type', '');
        if (empty($content) && !in_array($request->getMethod(), ['GET', 'DELETE']) && !str_contains(strtolower($contentType), 'application/json')) {
            error_log('WARNING: Request method ' . $request->getMethod() . ' with non-JSON content type (' . $contentType . ') has an empty raw body. This might indicate $request->request will also be empty if not handled by a listener or server config.');
        }

        $this->denyAccessUnlessGranted('edit', $restaurant);

        $_entityWasModified_ = false; // Flag to track actual changes

        $originalFoodTypes = new ArrayCollection();
        foreach ($restaurant->getFoodTypes() as $foodType) {
            $originalFoodTypes->add($foodType);
        }

        $isJsonRequest = str_contains($request->headers->get('Content-Type', ''), 'application/json');
        $data = [];

        if ($isJsonRequest) {
            $jsonData = json_decode($request->getContent(), true);
            if ($jsonData === null && json_last_error() !== JSON_ERROR_NONE) {
                return $this->json(['message' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
            }
            $data = $jsonData ?? [];
        } else {
            // For form-data or x-www-form-urlencoded
            // Note: PUT requests with multipart/form-data can be tricky and might not populate $request->request as expected by default in all PHP/Symfony setups without workarounds.
            // However, Symfony generally handles this by parsing the body for PUT if Content-Type is appropriate.
            // If $request->request is empty for PUT with FormData, this indicates a deeper issue or need for a listener to parse the body.
            // For simplicity, we assume $request->request will be populated or $request->get() works.
            $data = $request->request->all();
        }

        // Helper to get data from request, prioritizing direct request parameters if not JSON
        $getRequestParam = function(string $key, $default = null) use ($request, $isJsonRequest, $data) {
            if ($isJsonRequest) {
                return array_key_exists($key, $data) ? $data[$key] : $default;
            }
            return $request->request->get($key, $default);
        };
        
        $getRequestParamAll = function() use ($request, $isJsonRequest, $data) {
            if ($isJsonRequest) {
                return $data;
            }
            return $request->request->all();
        };


        // Update fields - prioritize fields from request data
        $nameValue = $getRequestParam('name');
        if ($nameValue !== null && !empty(trim($nameValue))) {
            if ($restaurant->getName() !== trim($nameValue)) {
                $restaurant->setName(trim($nameValue));
                $_entityWasModified_ = true;
            }
        }

        // Email is no longer updatable through this endpoint
        // $emailValue = $getRequestParam('email');
        // if ($emailValue !== null && $emailValue !== $restaurant->getEmail()) {
        //     $emailConstraint = new Assert\Email();
        //     $emailErrors = $validator->validate($emailValue, $emailConstraint);
        //     if (count($emailErrors) > 0) {
        //          return $this->json(['errors' => ['email' => $emailErrors[0]->getMessage()]], Response::HTTP_BAD_REQUEST);
        //     }
        //     $restaurant->setEmail($emailValue);
        //     $_entityWasModified_ = true;
        // }

        $phoneValue = $getRequestParam('phone');
        if ($phoneValue !== null) { 
            $newPhone = empty($phoneValue) ? null : $phoneValue;
            if ($restaurant->getPhone() !== $newPhone) {
                $restaurant->setPhone($newPhone);
                $_entityWasModified_ = true;
            }
        }



        $openingTimeStr = $getRequestParam('openingTime');
        if ($openingTimeStr !== null) {
            $newOpeningTime = null;
            if (!empty($openingTimeStr)) {
                try {
                    $newOpeningTime = new DateTimeImmutable($openingTimeStr);
                } catch (\Exception $e) {
                    return $this->json(['errors' => ['openingTime' => 'Invalid opening time format. Use HH:MM.']], Response::HTTP_BAD_REQUEST);
                }
            }
            // Compare string representations or formatted times if $restaurant->getOpeningTime() is not null
            $currentOpeningTimeStr = $restaurant->getOpeningTime() ? $restaurant->getOpeningTime()->format('H:i:s') : null;
            $newOpeningTimeStr = $newOpeningTime ? $newOpeningTime->format('H:i:s') : null;
            if ($currentOpeningTimeStr !== $newOpeningTimeStr) {
                 $restaurant->setOpeningTime($newOpeningTime);
                 $_entityWasModified_ = true;
            }
        }

        $closingTimeStr = $getRequestParam('closingTime');
        if ($closingTimeStr !== null) {
            $newClosingTime = null;
            if (!empty($closingTimeStr)) {
                try {
                    $newClosingTime = new DateTimeImmutable($closingTimeStr);
                } catch (\Exception $e) {
                    return $this->json(['errors' => ['closingTime' => 'Invalid closing time format. Use HH:MM.']], Response::HTTP_BAD_REQUEST);
                }
            }
            $currentClosingTimeStr = $restaurant->getClosingTime() ? $restaurant->getClosingTime()->format('H:i:s') : null;
            $newClosingTimeStr = $newClosingTime ? $newClosingTime->format('H:i:s') : null;
            if ($currentClosingTimeStr !== $newClosingTimeStr) {
                $restaurant->setClosingTime($newClosingTime);
                $_entityWasModified_ = true;
            }
        }

        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile');

        if ($imageFile) {
            $imageConstraint = new Assert\Image([
                'maxSize' => '4M',
                'mimeTypes' => [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ]
            ]);

            $imageErrors = $validator->validate($imageFile, $imageConstraint);

            if (count($imageErrors) > 0) {
                $errorMessages = [];
                foreach ($imageErrors as $error) {
                    $errorMessages['imageFile'][] = $error->getMessage();
                }
                return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
            }

            $originalImageFilename = $restaurant->getImageFilename();
            try {
                $newFilename = $this->imageUploader->uploadImage($imageFile);
                if ($originalImageFilename !== $newFilename) { // Also check if filename actually changed
                    $restaurant->setImageFilename($newFilename);
                    $_entityWasModified_ = true; // Image changed
                    if ($originalImageFilename) {
                        $this->imageUploader->deleteImage($originalImageFilename);
                    }
                } elseif (!$originalImageFilename && $newFilename) { // Was null, now has a name
                     $restaurant->setImageFilename($newFilename);
                    $_entityWasModified_ = true;
                }
            } catch (FileException $e) {
                return $this->json(['errors' => ['imageFile' => $e->getMessage()]], Response::HTTP_BAD_REQUEST);
            }
        }
        
        $allRequestData = $getRequestParamAll(); // Get all data for food_type_ids, password, address

        // Handle address update (simplified change detection)
        $addressData = $allRequestData['address'] ?? null;
        if (is_array($addressData)) {
            $restaurantAddress = $restaurant->getAddress();
            $addressModified = false;
            if (!$restaurantAddress) {
                $restaurantAddress = new RestaurantAddress();
                $restaurantAddress->setRestaurant($restaurant);
                // If a new address is created, it's definitely a modification if it has data
                if (!empty($addressData['address_line'])) $addressModified = true; 
            }
            // Example: only check one field for simplicity, expand as needed
            if (isset($addressData['address_line']) && $restaurantAddress->getAddressLine() !== $addressData['address_line']) {
                $addressModified = true;
            }
            // ... (set other address fields as before) ...
            // Assuming setters are called, if addressModified is true, then _entityWasModified_ should be true
            if ($addressModified) {
                 // Set all fields before this point
                $allowedAddressFields = ['address_line', 'lat', 'lng'];
                foreach($allowedAddressFields as $field) {
                    if (array_key_exists($field, $addressData)) {
                        $setterMethod = 'set' . ucfirst(str_replace('_', '', ucwords($field, '_')));
                        if (method_exists($restaurantAddress, $setterMethod)) {
                            // Further check if value actually changes before calling setter & setting modified flag
                             $getterMethod = 'get' . ucfirst(str_replace('_', '', ucwords($field, '_')));
                            if (!method_exists($restaurantAddress, $getterMethod) || $restaurantAddress->$getterMethod() !== $addressData[$field]) {
                                $restaurantAddress->$setterMethod($addressData[$field]);
                                $_entityWasModified_ = true; // Mark as modified
                            }
                        }
                    }
                }
                $restaurant->setAddress($restaurantAddress);
            }
        } elseif (array_key_exists('address', $allRequestData) && $allRequestData['address'] === null) {
            if ($restaurant->getAddress() !== null) {
                $restaurant->setAddress(null);
                $_entityWasModified_ = true;
            }
        }

        if (isset($allRequestData['password']) && !empty($allRequestData['password'])) {
             if (strlen($allRequestData['password']) >= 6) {
                 // Password change is always a modification if new password is provided
                 $hashedPassword = $passwordHasher->hashPassword($restaurant, $allRequestData['password']);
                 $restaurant->setPassword($hashedPassword);
                 $_entityWasModified_ = true;
             } else {
                 return $this->json(['errors' => ['password' => ['Password must be at least 6 characters long']]], Response::HTTP_BAD_REQUEST);
             }
        }
        
        $foodTypeIdsInput = $allRequestData['food_type_ids'] ?? null;
        if ($foodTypeIdsInput !== null && !is_array($foodTypeIdsInput)) {
             $foodTypeIdsInput = [$foodTypeIdsInput];
        }
        if (is_array($foodTypeIdsInput)) {
            $foodTypeIdsInput = array_map('intval', $foodTypeIdsInput);
            $currentFoodTypeIds = $restaurant->getFoodTypes()->map(fn(FoodType $ft) => $ft->getId())->toArray();
            sort($currentFoodTypeIds);
            sort($foodTypeIdsInput);
            if ($currentFoodTypeIds !== $foodTypeIdsInput) { // Compare sorted arrays of IDs
                $_entityWasModified_ = true; 
                // Remove food types not in the new list
                foreach ($originalFoodTypes as $foodType) {
                    if (!in_array($foodType->getId(), $foodTypeIdsInput, true)) {
                        $restaurant->removeFoodType($foodType);
                    }
                }
                // Add new food types
                foreach ($foodTypeIdsInput as $foodTypeId) {
                    $foodType = $foodTypeRepository->find($foodTypeId);
                    if ($foodType && !$restaurant->getFoodTypes()->contains($foodType)) {
                        $restaurant->addFoodType($foodType);
                    }
                }
            }
        }

        $errors = $validator->validate($restaurant);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        if (!$_entityWasModified_) {
            // Option 1: Return 304 Not Modified (typically used for GET with caching headers, but can signify no change)
            // return new JsonResponse(null, Response::HTTP_NOT_MODIFIED);
            // Option 2: Return 200 OK with a specific message or the original entity
            $json = $serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read']);
            return new JsonResponse([
                'message' => 'No changes detected. Profile data remains the same.',
                'data' => json_decode($json) // Send current data back
            ], Response::HTTP_OK);
        }

        try {
            $entityManager->flush();
        } catch (\Exception $e) {
            // Log the exception $e->getMessage()
            return $this->json(['message' => 'An error occurred while saving changes.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        // If entity was modified and flush was successful
        $json = $serializer->serialize($restaurant, 'json', ['groups' => 'restaurant:read']);
        return new JsonResponse(json_decode($json), Response::HTTP_OK); // Return 200 OK with updated entity
    }

    #[Route('/{id}', name: 'api_restaurant_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')] // Only Admins can delete restaurants
    public function delete(Restaurant $restaurant, EntityManagerInterface $entityManager): JsonResponse
    {
        $imageFilename = $restaurant->getImageFilename(); // Get filename before removing entity

        $entityManager->remove($restaurant);
        $entityManager->flush();

        // Delete the image file after successfully removing the entity
        if ($imageFilename) {
            $this->imageUploader->deleteImage($imageFilename);
        }

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