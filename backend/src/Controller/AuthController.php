<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Entity\Restaurant; // For restaurant registration
use App\Repository\RestaurantRepository; // For restaurant registration
use App\Entity\UserAddress; // Corrected: Ensure this is UserAddress, not RestaurantAddress for user registration context
use App\Entity\RestaurantAddress; // This is for restaurant registration, keep it if used elsewhere
use App\Repository\FoodTypeRepository;
use App\Service\ImageUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

#[Route('/api/auth')] // Base route for auth actions
final class AuthController extends AbstractController
{
    #[Route('/register/user', name: 'api_auth_register_user', methods: ['POST'])]
    public function registerUser(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        RestaurantRepository $restaurantRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON payload'], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json(['message' => 'Missing email or password'], Response::HTTP_BAD_REQUEST);
        }

        // Basic validation (use Validator component for better validation)
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
             return $this->json(['message' => 'Invalid email format'], Response::HTTP_BAD_REQUEST);
        }
        if (strlen($data['password']) < 6) {
             return $this->json(['message' => 'Password must be at least 6 characters long'], Response::HTTP_BAD_REQUEST);
        }

        // Check if email exists in User table
        $existingUser = $userRepository->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            return $this->json(['message' => 'User email already exists'], Response::HTTP_CONFLICT);
        }

        // Check if email exists in Restaurant table
        $existingRestaurant = $restaurantRepository->findOneBy(['email' => $data['email']]);
        if ($existingRestaurant) {
            return $this->json(['message' => 'Email is already registered as a restaurant'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name'] ?? null);
        $user->setPhone($data['phone'] ?? null);

        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);
        $user->setRoles(['ROLE_USER']);

        // Create and set UserAddress if provided
        $addressData = $data['address'] ?? null;

        if (is_array($addressData)) {
            $userAddress = new UserAddress();
            $userAddress->setAddressLine($addressData['address_line'] ?? null);
            $userAddress->setLat($addressData['lat'] ?? null);
            $userAddress->setLng($addressData['lng'] ?? null);
            $userAddress->setProvince($addressData['province'] ?? null);
            $user->setAddress($userAddress); // Associate for validation only if address data is provided
        }
        // If addressData is not an array, $user->address remains null (or uninitialized).
        // Validation will proceed accordingly.

        // Validate the User entity (which will also validate UserAddress due to Assert\Valid)
        $errors = $validator->validate($user);

        $errorMessages = [];
        if (count($errors) > 0) {
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
        }

        if (!empty($errorMessages)) {
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($user);
        // $entityManager->persist($userAddress); // Not strictly necessary if cascade persist is working correctly on User::$address
        $entityManager->flush();

        return $this->json(['message' => 'User registered successfully with address', 'userId' => $user->getId()], Response::HTTP_CREATED);
    }

    #[Route('/register/restaurant', name: 'api_auth_register_restaurant', methods: ['POST'])]
    public function registerRestaurant(
        Request $request,
        UserPasswordHasherInterface $passwordHasher, 
        EntityManagerInterface $entityManager,
        RestaurantRepository $restaurantRepository,
        UserRepository $userRepository,
        FoodTypeRepository $foodTypeRepository, 
        ValidatorInterface $validator,
        ImageUploader $imageUploader 
    ): JsonResponse {
        // --- Access form data from multipart/form-data ---
        $email = $request->request->get('email');
        $password = $request->request->get('password');
        $name = $request->request->get('name');
        $openingTimeStr = $request->request->get('openingTime');
        $closingTimeStr = $request->request->get('closingTime');
        $addressJson = $request->request->get('address');
        $foodTypeIdsJson = $request->request->get('food_type_ids');
        $phone = $request->request->get('phone'); // Optional
        $takesReservations = filter_var($request->request->get('takes_reservations', false), FILTER_VALIDATE_BOOLEAN); // Optional
        $tableCount = $request->request->get('table_count'); // Optional
        $reservationDuration = $request->request->get('reservationDuration', 60); // Optional
        /** @var UploadedFile|null $imageFile */
        $imageFile = $request->files->get('imageFile'); // Access uploaded file

        // --- Decode JSON fields ---
        $addressData = json_decode((string) $addressJson, true);
        $foodTypeIds = json_decode((string) $foodTypeIdsJson, true);

        // --- Basic validation for required fields ---
        $requiredFields = [
            'email' => $email,
            'password' => $password,
            'name' => $name,
            'openingTime' => $openingTimeStr,
            'closingTime' => $closingTimeStr,
            'address' => $addressData,
            'food_type_ids' => $foodTypeIds,
        ];

        foreach ($requiredFields as $field => $value) {
            // Check for null or empty string for non-array fields
            if (!is_array($value) && ($value === null || $value === '')) {
                 return $this->json(['message' => "Missing required field: {$field}"], Response::HTTP_BAD_REQUEST);
            }
            // Check specifically for address and food_type_ids which should be arrays after decoding
            if (($field === 'address' || $field === 'food_type_ids') && (empty($value) || !is_array($value))) {
                 return $this->json(['message' => "Invalid or missing required field: {$field}"], Response::HTTP_BAD_REQUEST);
            }
        }

        // Address structure validation
        if (!isset($addressData['address_line']) || !isset($addressData['lat']) || !isset($addressData['lng']) || !isset($addressData['province'])) {
             return $this->json(['message' => 'Invalid address structure in \'address\' field. Required keys: address_line, lat, lng, province'], Response::HTTP_BAD_REQUEST);
        }
         // Food type IDs validation
        if (empty($foodTypeIds)) { // Already checked if it's an array and not empty above
            return $this->json(['message' => 'food_type_ids must be a non-empty array'], Response::HTTP_BAD_REQUEST);
        }


        // --- Further Basic validation ---
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
             return $this->json(['message' => 'Invalid email format'], Response::HTTP_BAD_REQUEST);
        }
        if (strlen($password) < 6) {
             return $this->json(['message' => 'Password must be at least 6 characters long'], Response::HTTP_BAD_REQUEST);
        }
        // Basic time format validation (HH:MM or HH:MM:SS) - createFromFormat will do the strict check
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', (string) $openingTimeStr) || !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', (string) $closingTimeStr)) {
            return $this->json(['message' => 'Invalid time format structure. Use HH:MM:SS'], Response::HTTP_BAD_REQUEST);
        }


        // --- Check for existing email ---
        $existingRestaurant = $restaurantRepository->findOneBy(['email' => $email]);
        if ($existingRestaurant) {
            return $this->json(['message' => 'Restaurant email already exists'], Response::HTTP_CONFLICT);
        }
        $existingUser = $userRepository->findOneBy(['email' => $email]);
        if ($existingUser) {
            return $this->json(['message' => 'Email is already registered as a user'], Response::HTTP_CONFLICT);
        }

        // --- Create and Populate Restaurant Entity ---
        $restaurant = new Restaurant();
        $restaurant->setEmail($email);
        $restaurant->setName($name);
        $restaurant->setPhone($phone ?? null);
        $restaurant->setTakesReservations($takesReservations);
        $restaurant->setTableCount($tableCount !== null ? (int)$tableCount : null);
        $restaurant->setReservationDuration($reservationDuration !== null ? (int)$reservationDuration : 60);

        // Handle image upload using the service
        $imageFilename = null;
        if ($imageFile) {
            try {
                $imageFilename = $imageUploader->uploadImage($imageFile); // Changed method name to uploadImage
                $restaurant->setImageFilename($imageFilename);
            } catch (FileException $e) {
                 return $this->json(['message' => 'Could not process uploaded image: '.$e->getMessage()], Response::HTTP_BAD_REQUEST); 
            }
        }
        // No need to set imageFilename if $imageFile is null, it's already null

        // Set Opening and Closing Times (Expecting HH:MM:SS format)
        try {
            $format = 'H:i:s'; // STRICTLY expect this format

            // Use DateTimeImmutable directly, assuming frontend sends H:i:s
            $openingTime = \DateTimeImmutable::createFromFormat($format, (string)$openingTimeStr);
            $closingTime = \DateTimeImmutable::createFromFormat($format, (string)$closingTimeStr);

            // Check if parsing failed
            if ($openingTime === false || $closingTime === false) {
                 // Provide a specific error stating the required format
                 $invalidTime = $openingTime === false ? $openingTimeStr : $closingTimeStr;
                 $whichTime = $openingTime === false ? 'opening' : 'closing';
                 $errorMessage = sprintf(
                    'Invalid %s time format: "%s". Required format is HH:MM:SS.',
                    $whichTime,
                    $invalidTime
                 );
                throw new \InvalidArgumentException($errorMessage);
            }

            if ($openingTime >= $closingTime) {
                throw new \InvalidArgumentException('Opening time must be before closing time.');
            }

            $restaurant->setOpeningTime($openingTime);
            $restaurant->setClosingTime($closingTime);
        } catch (\InvalidArgumentException $e) { // Catch specific exception type
            // Return the clearer error message from the catch block
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) { // Catch any other unexpected errors during time processing
             return $this->json(['message' => 'An unexpected error occurred processing time: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Handle Address creation
        $address = new RestaurantAddress();
        $address->setAddressLine($addressData['address_line']);
        $address->setLat($addressData['lat']); // Assuming these are strings from JSON
        $address->setLng($addressData['lng']);
        $address->setProvince($addressData['province']);
        $address->setRestaurant($restaurant); // Link address to restaurant
        $restaurant->setAddress($address); // Link restaurant to address

        // Handle FoodTypes linking
        foreach ($foodTypeIds as $foodTypeId) {
             if (!is_numeric($foodTypeId)) {
                 return $this->json(['message' => "Invalid non-numeric food_type_id provided: {$foodTypeId}"], Response::HTTP_BAD_REQUEST);
             }
            $foodType = $foodTypeRepository->find((int)$foodTypeId);
            if ($foodType) {
                $restaurant->addFoodType($foodType);
            } else {
                // Optionally return an error if a food type ID is invalid
                 return $this->json(['message' => "Invalid food_type_id provided: {$foodTypeId}"], Response::HTTP_BAD_REQUEST);
            }
        }

        // Hash password and set roles
        $hashedPassword = $passwordHasher->hashPassword($restaurant, $password);
        $restaurant->setPassword($hashedPassword);
        $restaurant->setRoles(['ROLE_RESTAURANT']);

        // Validate the Restaurant and Address entities
        $errors = $validator->validate($restaurant);
        $addressErrors = $validator->validate($address); // Also validate the address

        if (count($errors) > 0 || count($addressErrors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages['restaurant'][$error->getPropertyPath()][] = $error->getMessage();
            }
             foreach ($addressErrors as $error) {
                $errorMessages['address'][$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        // Persist entities
        $entityManager->persist($restaurant);
        $entityManager->persist($address); // Persist the address too
        $entityManager->flush();

        // Include the path to the uploaded image if available
        $responseData = [
            'message' => 'Restaurant registered successfully',
        ];
        
        return $this->json($responseData, Response::HTTP_CREATED);
    }

    // Login check endpoint (/api/login_check) is handled by LexikJWTAuthenticationBundle
    // We might add an endpoint like /api/auth/me to get current user info after login
    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function getCurrentUser(SerializerInterface $serializer): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['message' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Use appropriate serialization group (e.g., 'user:read:self' or 'restaurant:read:self')
        // Need to differentiate between User and Restaurant types
        $groups = [];
        if ($user instanceof User) {
            $groups = ['user:read']; // Or a more specific 'user:read:self'
        } elseif ($user instanceof Restaurant) {
            $groups = ['restaurant:read']; // Or 'restaurant:read:self'
        }

        if (empty($groups)){
             return $this->json(['message' => 'Cannot determine user type for serialization'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $json = $serializer->serialize($user, 'json', ['groups' => $groups]);

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
} 