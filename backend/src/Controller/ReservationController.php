<?php

namespace App\Controller;

use App\Controller\Trait\ApiResponseTrait;
use App\Controller\Trait\PaginationTrait;
use App\Entity\Reservation;
use App\Entity\User;
use App\Entity\Restaurant;
use App\Repository\ReservationRepository;
use App\Repository\RestaurantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException; // For 404
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use JsonException;

#[Route('/api/reservations')] // Base route for reservations
final class ReservationController extends AbstractController
{
    use PaginationTrait;
    use ApiResponseTrait;

    #[Route('', name: 'api_reservation_index', methods: ['GET'])]
    public function index(ReservationRepository $reservationRepository, Request $request): JsonResponse
    {
        if ($confirmationCode = $request->query->get('confirmationCode')) {
            $code = strtoupper(trim($confirmationCode));
            $reservation = $reservationRepository->findOneBy(['confirmationCode' => $code]);

            if (!$reservation) {
                return $this->apiErrorResponse('Reservation with this code not found.', Response::HTTP_NOT_FOUND);
            }

            $this->denyAccessUnlessGranted('view', $reservation);
            return $this->apiSuccessResponse($reservation, Response::HTTP_OK, ['reservation:read']);
        }

        $currentUser = $this->getUser();
        $qb = $reservationRepository->createQueryBuilder('rsv')
                 ->leftJoin('rsv.user', 'u')->addSelect('u')
                 ->leftJoin('rsv.restaurant', 'r')->addSelect('r');

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
            return $this->apiErrorResponse('Unauthorized access to reservations.', Response::HTTP_FORBIDDEN);
        }

        $qb->orderBy('rsv.reservation_datetime', 'DESC');
        $paginationData = $this->paginate($qb, $request);

        return $this->apiSuccessResponse($paginationData, Response::HTTP_OK, ['reservation:read:collection']);
    }

    #[Route('/{id}', name: 'api_reservation_show', methods: ['GET'])]
    #[IsGranted('view', 'reservation')]
    public function show(Reservation $reservation): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $reservation);
        return $this->apiSuccessResponse($reservation, Response::HTTP_OK, ['reservation:read']);
    }

    #[Route('', name: 'api_reservation_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository
    ): JsonResponse {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->apiErrorResponse('Only registered users can create reservations.', Response::HTTP_FORBIDDEN);
        }

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->apiErrorResponse('Invalid JSON payload: ' . $e->getMessage(), Response::HTTP_BAD_REQUEST, ['json_error' => $e->getMessage()]);
        }

        if (!isset($data['restaurantId']) || !isset($data['reservation_datetime'])) {
             return $this->apiErrorResponse('Missing required fields: restaurantId, reservation_datetime', Response::HTTP_BAD_REQUEST);
        }

        $restaurant = $restaurantRepository->find($data['restaurantId']);
        if (!$restaurant) {
            return $this->apiErrorResponse('Restaurant not found', Response::HTTP_NOT_FOUND);
        }

        if (!$restaurant->isTakesReservations()) {
             return $this->apiErrorResponse('This restaurant does not take reservations.', Response::HTTP_BAD_REQUEST);
        }

        $reservation = new Reservation();
        $reservation->setUser($currentUser);
        $reservation->setRestaurant($restaurant);

        try {
            $dateTime = new \DateTimeImmutable($data['reservation_datetime']);
            $reservation->setReservationDatetime($dateTime);
        } catch (\Exception $e) {
            return $this->apiErrorResponse('Invalid reservation_datetime format', Response::HTTP_BAD_REQUEST);
        }

        $errors = $validator->validate($reservation);
        if (count($errors) > 0) {
            return $this->apiValidationErrorResponse($errors);
        }

        $entityManager->persist($reservation);
        $entityManager->flush(); 

        $maxAttempts = 5; 
        $attempt = 0;
        do {
            $confirmationCode = strtoupper(bin2hex(random_bytes(8)));
            $reservation->setConfirmationCode($confirmationCode);
            try {
                $entityManager->flush(); 
                break; 
            } catch (UniqueConstraintViolationException $e) {
                $attempt++;
                if ($attempt >= $maxAttempts) {
                    return $this->apiErrorResponse('Failed to generate a unique confirmation code.', Response::HTTP_INTERNAL_SERVER_ERROR);
                }
                $entityManager->refresh($reservation); 
            }
        } while ($attempt < $maxAttempts);

        return $this->apiSuccessResponse($reservation, Response::HTTP_CREATED, ['reservation:read']);
    }

    #[Route('/{id}', name: 'api_reservation_update_state', methods: ['PATCH'])]
    #[IsGranted('update_state', 'reservation')]
    public function updateState(
        Request $request,
        Reservation $reservation, 
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted('update_state', $reservation);
        
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->apiErrorResponse('Invalid JSON payload: ' . $e->getMessage(), Response::HTTP_BAD_REQUEST, ['json_error' => $e->getMessage()]);
        }

        if (!isset($data['state'])) {
            return $this->apiErrorResponse('Missing state field', Response::HTTP_BAD_REQUEST);
        }

        $newState = $data['state'];
        $currentState = $reservation->getState();

        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled_by_restaurant'],
            'confirmed' => ['completed', 'cancelled_by_restaurant'],
            'completed' => [],  
            'cancelled_by_restaurant' => [], 
            'cancelled_by_user' => [] 
        ];

        if (!isset($allowedTransitions[$currentState]) || !in_array($newState, $allowedTransitions[$currentState])) {
             return $this->apiErrorResponse(sprintf('Restaurant cannot change reservation state from "%s" to "%s"', $currentState, $newState), Response::HTTP_BAD_REQUEST);
        }

        $allPossibleStates = ['pending', 'confirmed', 'cancelled_by_user', 'cancelled_by_restaurant', 'completed'];
        if (!in_array($newState, $allPossibleStates)) {
            return $this->apiErrorResponse('Invalid target state value', Response::HTTP_BAD_REQUEST);
        }

        $reservation->setState($newState);

        $errors = $validator->validate($reservation);
        if (count($errors) > 0) {
            return $this->apiValidationErrorResponse($errors);
        }

        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/cancel', name: 'api_reservation_cancel_by_user', methods: ['PATCH'])]
    #[IsGranted('cancel', 'reservation')]
    public function cancelByUser(
        Reservation $reservation, 
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $reservation->setState('cancelled_by_user');
        $entityManager->flush();

        return $this->apiSuccessResponse(['message' => 'Reservation cancelled successfully.'], Response::HTTP_OK);
    }
}
