<?php

namespace App\Controller;

use App\Controller\Trait\ApiResponseTrait;
use App\Controller\Trait\PaginationTrait;
use App\Entity\Order;
use App\Entity\Restaurant;
use App\Entity\User;
use App\Repository\OrderRepository;
use App\Repository\RestaurantRepository;
use App\Repository\ArticleRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use JsonException;

#[Route('/api/orders')] // Base route for orders
final class OrderController extends AbstractController
{
    use PaginationTrait;
    use ApiResponseTrait;

    public function __construct(
        private NotificationService $notificationService,
        private HubInterface $mercureHub
    ) {}

    #[Route('', name: 'api_order_index', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')] // Requires authentication (specific role filtering below)
    public function index(OrderRepository $orderRepository, Request $request): JsonResponse
    {
        $currentUser = $this->getUser();
        $qb = $orderRepository->createQueryBuilder('o')
                 ->leftJoin('o.user', 'u')->addSelect('u') // Include user data
                 ->leftJoin('o.restaurant', 'r')->addSelect('r'); // Include restaurant data

        // Filtering based on role
        if ($this->isGranted('ROLE_ADMIN')) {
            if ($userId = $request->query->get('userId')) {
                $qb->andWhere('o.user = :userId')->setParameter('userId', $userId);
            }
            if ($restaurantId = $request->query->get('restaurantId')) {
                $qb->andWhere('o.restaurant = :restaurantId')->setParameter('restaurantId', $restaurantId);
            }
        } elseif ($currentUser instanceof Restaurant) {
            $qb->andWhere('o.restaurant = :restaurantId')->setParameter('restaurantId', $currentUser->getId());
        } elseif ($currentUser instanceof User) {
            $qb->andWhere('o.user = :userId')->setParameter('userId', $currentUser->getId());
        } else {
            return $this->apiErrorResponse('Unauthorized access to orders.', Response::HTTP_FORBIDDEN);
        }

        // Status filtering
        if ($status = $request->query->get('status')) {
            $validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
            if (in_array($status, $validStatuses)) {
                $qb->andWhere('o.status = :status')->setParameter('status', $status);
            }
        }

        // Date filtering
        if ($dateFrom = $request->query->get('dateFrom')) {
            try {
                $fromDate = new \DateTime($dateFrom);
                $fromDate->setTime(0, 0, 0); // Start of day
                $qb->andWhere('o.created_at >= :dateFrom')->setParameter('dateFrom', $fromDate);
            } catch (\Exception $e) {
                // Invalid date format, ignore filter
            }
        }

        if ($dateTo = $request->query->get('dateTo')) {
            try {
                $toDate = new \DateTime($dateTo);
                $toDate->setTime(23, 59, 59); // End of day
                $qb->andWhere('o.created_at <= :dateTo')->setParameter('dateTo', $toDate);
            } catch (\Exception $e) {
                // Invalid date format, ignore filter
            }
        }

        // Apply pagination
        $qb->orderBy('o.created_at', 'DESC');

        $paginationData = $this->paginate($qb, $request);

        return $this->apiSuccessResponse($paginationData, Response::HTTP_OK, ['order:read:collection']);
    }

    #[Route('/{id}', name: 'api_order_show', methods: ['GET'])]
    #[IsGranted('view', 'order')] // Assumes OrderVoter handles ownership/admin check
    public function show(Order $order): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $order); // Voter checks user/restaurant ownership or admin

        return $this->apiSuccessResponse($order, Response::HTTP_OK, ['order:read']);
    }

    #[Route('', name: 'api_order_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')] // Only regular users can create orders
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository,
        ArticleRepository $articleRepository
    ): JsonResponse {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->apiErrorResponse('Only registered users can create orders.', Response::HTTP_FORBIDDEN);
        }

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->apiErrorResponse('Invalid JSON payload: ' . $e->getMessage(), Response::HTTP_BAD_REQUEST, ['json_error' => $e->getMessage()]);
        }

        if (!isset($data['restaurantId']) || !isset($data['items'])) {
             return $this->apiErrorResponse('Missing required fields: restaurantId, items', Response::HTTP_BAD_REQUEST);
        }

        $restaurant = $restaurantRepository->find($data['restaurantId']);
        if (!$restaurant) {
            return $this->apiErrorResponse('Restaurant not found', Response::HTTP_NOT_FOUND);
        }

        $order = new Order();
        $order->setUser($currentUser);
        $order->setRestaurant($restaurant);
        $order->setItems($data['items']); 

        $priceCalculationResult = $this->calculateTotalPriceAndValidateItems($data['items'], $articleRepository, $restaurant);

        if (isset($priceCalculationResult['errorResponse'])) {
            return $priceCalculationResult['errorResponse'];
        }
        $calculatedTotalPrice = $priceCalculationResult['totalPrice'];

        $order->setTotalPrice(sprintf('%.2f', $calculatedTotalPrice));

        $errors = $validator->validate($order);
        if (count($errors) > 0) {
            return $this->apiValidationErrorResponse($errors);
        }

        $entityManager->persist($order);
        $entityManager->flush();

        // Send notification to restaurant through the notification service
        $notificationSent = $this->notificationService->notifyNewOrder($order->getId(), $restaurant->getId());
        
        if (!$notificationSent) {
            // Log the error but continue with order creation
            // The notification failed but we don't want to fail the entire order
            // We'll still try the direct Mercure approach as a fallback
        }

        try {
            // Publish to Mercure for the restaurant as a fallback
            $restaurantTopic = sprintf('/orders/restaurant/%s', $restaurant->getId());
            $orderData = [
                'orderId' => $order->getId(),
                'userId' => $currentUser->getId(),
                'restaurantId' => $restaurant->getId(),
                'items' => $order->getItems(),
                'totalPrice' => $order->getTotalPrice(),
                'status' => $order->getStatus(),
                'createdAt' => $order->getCreatedAt() ? $order->getCreatedAt()->format(\DateTimeInterface::ATOM) : null,
            ];
            $update = new Update(
                $restaurantTopic,
                json_encode($orderData),
                true // Private update
            );
            $this->mercureHub->publish($update);
        } catch (\Exception $e) {
            // Log the error but continue with order creation
            // We don't want to fail the entire order if notifications fail
        }

        return $this->apiSuccessResponse($order, Response::HTTP_CREATED, ['order:read']);
    }

    #[Route('/{id}', name: 'api_order_update_status', methods: ['PATCH'])]
    #[IsGranted('update_status', 'order')] // Custom voter attribute
    public function updateStatus(
        Request $request,
        Order $order,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted('update_status', $order);

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->apiErrorResponse('Invalid JSON payload: ' . $e->getMessage(), Response::HTTP_BAD_REQUEST, ['json_error' => $e->getMessage()]);
        }

        if (!isset($data['status'])) {
            return $this->apiErrorResponse('Missing status field', Response::HTTP_BAD_REQUEST);
        }

        $newState = $data['status'];
        $currentState = $order->getStatus();

        $allowedTransitions = [
            'pending' => ['preparing', 'cancelled'],
            'preparing' => ['ready', 'cancelled'],
            'ready' => ['completed', 'cancelled']
        ];

        if (!isset($allowedTransitions[$currentState]) || !in_array($newState, $allowedTransitions[$currentState])) {
             return $this->apiErrorResponse(sprintf('Cannot change order status from "%s" to "%s"', $currentState, $newState), Response::HTTP_BAD_REQUEST);
        }

        $order->setStatus($newState);

        $errors = $validator->validate($order);
        if (count($errors) > 0) {
            return $this->apiValidationErrorResponse($errors);
        }

        $entityManager->flush();

        // Send notification to user
        $notificationSent = $this->notificationService->notifyOrderStatusChange(
            $order->getId(),
            $order->getUser()->getId(),
            $newState
        );
        
        if (!$notificationSent) {
            // Log the error but continue with status update
            // The notification failed but we don't want to fail the entire status update
            // We'll still try the direct Mercure approach as a fallback
        }

        // Publish to Mercure for the user as a fallback
        $user = $order->getUser();
        if ($user) {
            try {
                $userTopic = sprintf('/orders/user/%s', $user->getId());
                $statusUpdateData = [
                    'orderId' => $order->getId(),
                    'newStatus' => $newState,
                    'updatedAt' => $order->getUpdatedAt() ? $order->getUpdatedAt()->format(\DateTimeInterface::ATOM) : (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                ];
                $update = new Update(
                    $userTopic,
                    json_encode($statusUpdateData),
                    true // Private update
                );
                $this->mercureHub->publish($update);
            } catch (\Exception $e) {
                // Log the error but continue with status update
                // We don't want to fail the entire operation if notifications fail
            }
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Validates items and calculates the total price.
     *
     * @param array|null $itemsData
     * @param ArticleRepository $articleRepository
     * @param Restaurant $restaurant
     * @return array{totalPrice?: float, errorResponse?: JsonResponse}
     */
    private function calculateTotalPriceAndValidateItems(?array $itemsData, ArticleRepository $articleRepository, Restaurant $restaurant): array
    {
        if (empty($itemsData) || !is_array($itemsData)) {
            return ['errorResponse' => $this->json(['message' => 'Items cannot be empty and must be an array.'], Response::HTTP_BAD_REQUEST)];
        }

        $calculatedTotalPrice = 0.0;

        foreach ($itemsData as $itemData) {
            if (!isset($itemData['articleId']) || !isset($itemData['quantity'])) {
                return ['errorResponse' => $this->json(['message' => 'Each item must have articleId and quantity.'], Response::HTTP_BAD_REQUEST)];
            }

            $articleId = $itemData['articleId'];
            $quantity = (int)$itemData['quantity'];

            if ($quantity <= 0) {
                return ['errorResponse' => $this->json(['message' => sprintf('Quantity for article %s must be positive.', $articleId)], Response::HTTP_BAD_REQUEST)];
            }

            $article = $articleRepository->find($articleId);

            if (!$article) {
                return ['errorResponse' => $this->json(['message' => sprintf('Article with ID %s not found.', $articleId)], Response::HTTP_BAD_REQUEST)];
            }

            if ($article->getRestaurant()->getId() !== $restaurant->getId()) {
                return ['errorResponse' => $this->json(['message' => sprintf('Article %s does not belong to restaurant %s.', $articleId, $restaurant->getId())], Response::HTTP_BAD_REQUEST)];
            }
            
            if (!$article->isAvailable() || !$article->isListed()) {
                 return ['errorResponse' => $this->json(['message' => sprintf('Article %s (%s) is not available.', $articleId, $article->getName())], Response::HTTP_BAD_REQUEST)];
            }

            $calculatedTotalPrice += (float)$article->getPrice() * $quantity;
        }

        return ['totalPrice' => $calculatedTotalPrice];
    }
}