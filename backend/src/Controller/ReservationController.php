<?php

namespace App\Controller;

use App\Entity\Reservation;
use App\Entity\User;
use App\Entity\Restaurant;
use App\Repository\ReservationRepository;
use App\Repository\RestaurantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException; // For 404

#[Route('/api/reservations')] // Base route for reservations
final class ReservationController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10;

    #[Route('', name: 'api_reservation_index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')] // Requires login, more specific checks below
    public function index(ReservationRepository $reservationRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        // --- Handle Confirmation Code Lookup First ---
        if ($confirmationCode = $request->query->get('confirmationCode')) {
            $code = strtoupper(trim($confirmationCode));
            $reservation = $reservationRepository->findOneBy(['confirmationCode' => $code]);

            if (!$reservation) {
                throw $this->createNotFoundException('Reservation with this code not found.');
                // Or return $this->json(['message' => 'Reservation not found'], Response::HTTP_NOT_FOUND);
            }

            // Check view permission using the Voter
            $this->denyAccessUnlessGranted('view', $reservation);

            // Serialize and return the single reservation
            $json = $serializer->serialize($reservation, 'json', ['groups' => 'reservation:read']);
            return new JsonResponse($json, Response::HTTP_OK, [], true);
        }

        // --- Regular List Fetching and Pagination (If no confirmation code) ---
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

        $currentUser = $this->getUser();
        $qb = $reservationRepository->createQueryBuilder('rsv')
                 ->leftJoin('rsv.user', 'u')->addSelect('u')
                 ->leftJoin('rsv.restaurant', 'r')->addSelect('r');

        // Filtering based on role
        if ($this->isGranted('ROLE_ADMIN')) {
            if ($userId = $request->query->get('userId')) {
                $qb->andWhere('rsv.user = :userId')->setParameter('userId', $userId);
            }
            if ($restaurantId = $request->query->get('restaurantId')) {
                $qb->andWhere('rsv.restaurant = :restaurantId')->setParameter('restaurantId', $restaurantId);
            }
        } elseif ($currentUser instanceof Restaurant) {
            $qb->andWhere('rsv.restaurant = :restaurantId')->setParameter('restaurantId', $currentUser->getId());
        } elseif ($currentUser instanceof User) {
            $qb->andWhere('rsv.user = :userId')->setParameter('userId', $currentUser->getId());
        } else {
            // Should not happen if IsGranted('ROLE_USER') works, but defensive check
            return $this->json(['message' => 'Unauthorized access to reservations.'], Response::HTTP_FORBIDDEN);
        }

        // Apply pagination
        $qb->orderBy('rsv.reservation_datetime', 'DESC')
           ->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $paginator = new Paginator($qb->getQuery(), true);
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);

        $results = iterator_to_array($paginator->getIterator());

        $data = [
            'items' => $results,
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount
            ]
        ];

        // Define serialization group e.g., 'reservation:read:collection'
        $json = $serializer->serialize($data, 'json', ['groups' => 'reservation:read:collection']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_reservation_show', methods: ['GET'])]
    #[IsGranted('view', 'reservation')] // Assumes ReservationVoter
    public function show(Reservation $reservation, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $reservation); // Voter checks ownership or admin

        // Define serialization group e.g., 'reservation:read'
        $json = $serializer->serialize($reservation, 'json', ['groups' => 'reservation:read']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('', name: 'api_reservation_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')] // Only users can create reservations for themselves
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository
    ): JsonResponse {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['message' => 'Only registered users can create reservations.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['restaurantId']) || !isset($data['reservation_datetime'])) {
             return $this->json(['message' => 'Missing required fields: restaurantId, reservation_datetime'], Response::HTTP_BAD_REQUEST);
        }

        $restaurant = $restaurantRepository->find($data['restaurantId']);
        if (!$restaurant) {
            return $this->json(['message' => 'Restaurant not found'], Response::HTTP_BAD_REQUEST);
        }

        // Optional: Check if restaurant takes reservations
        if (!$restaurant->isTakesReservations()) {
             return $this->json(['message' => 'This restaurant does not take reservations.'], Response::HTTP_BAD_REQUEST);
        }

        $reservation = new Reservation(); // Constructor sets created_at and default state ('pending')
        $reservation->setUser($currentUser);
        $reservation->setRestaurant($restaurant);

        // Set reservation datetime (handle potential format errors)
        try {
            $dateTime = new \DateTimeImmutable($data['reservation_datetime']);
            $reservation->setReservationDatetime($dateTime);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Invalid reservation_datetime format'], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($reservation);
        $entityManager->flush(); // Flush first to get ID if needed

        // Generate and set confirmation code *after* initial flush
        // Ensure uniqueness (highly likely with random bytes, but could add a loop check if paranoid)
        $confirmationCode = strtoupper(bin2hex(random_bytes(8))); // Example: 16 char hex
        $reservation->setConfirmationCode($confirmationCode);
        $entityManager->flush(); // Flush again to save the code

        // Return created reservation data
        $json = $serializer->serialize($reservation, 'json', ['groups' => 'reservation:read']);
        return new JsonResponse($json, Response::HTTP_CREATED, [], true);
    }

    #[Route('/{id}', name: 'api_reservation_update_state', methods: ['PATCH'])]
    #[IsGranted('update_state', 'reservation')] // Custom voter attribute for state changes
    public function updateState(
        Request $request,
        Reservation $reservation, // The reservation to update
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        // Voter checks general permission (is owner restaurant? is current state modifiable?)
        $this->denyAccessUnlessGranted('update_state', $reservation);

        $data = json_decode($request->getContent(), true);

        if (!isset($data['state'])) {
            return $this->json(['message' => 'Missing state field'], Response::HTTP_BAD_REQUEST);
        }

        $newState = $data['state'];
        $currentState = $reservation->getState();

        // Define allowed transitions *for restaurants*
        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled_by_restaurant']
            // Add other transitions if needed, e.g.:
            // 'confirmed' => ['completed', 'cancelled_by_restaurant']
        ];

        // Check if this specific transition is allowed
        if (!isset($allowedTransitions[$currentState]) || !in_array($newState, $allowedTransitions[$currentState])) {
             return $this->json(['message' => sprintf('Restaurant cannot change reservation state from "%s" to "%s"', $currentState, $newState)], Response::HTTP_BAD_REQUEST);
        }

        // Basic validation of overall possible states (optional, could be entity constraint)
        $allPossibleStates = ['pending', 'confirmed', 'cancelled_by_user', 'cancelled_by_restaurant', 'completed'];
        if (!in_array($newState, $allPossibleStates)) {
            return $this->json(['message' => 'Invalid target state value'], Response::HTTP_BAD_REQUEST);
        }

        $reservation->setState($newState);

        $errors = $validator->validate($reservation);
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

    #[Route('/{id}/cancel', name: 'api_reservation_cancel_by_user', methods: ['PATCH'])]
    #[IsGranted('cancel', 'reservation')] // Use the CANCEL attribute and ReservationVoter
    public function cancelByUser(
        Reservation $reservation, // The reservation to cancel
        EntityManagerInterface $entityManager
    ): JsonResponse {
        // Voter already checked: user is owner, state is pending/confirmed, time is > 24h away

        $reservation->setState('cancelled_by_user');

        // No need to re-validate state usually, as Voter checked allowed current state
        // $errors = $validator->validate($reservation); ...

        $entityManager->flush();

        return new JsonResponse(['message' => 'Reservation cancelled successfully.'], Response::HTTP_OK);
    }

    // Delete action likely only for admins or specific cleanup tasks.
}
