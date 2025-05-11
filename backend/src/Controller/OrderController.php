<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\Restaurant;
use App\Entity\User;
use App\Repository\OrderRepository;
use App\Repository\RestaurantRepository;
use App\Repository\ArticleRepository;
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
use JsonException;

#[Route('/api/orders')] // Base route for orders
final class OrderController extends AbstractController
{
    private const ITEMS_PER_PAGE = 10;

    #[Route('', name: 'api_order_index', methods: ['GET'])]
    #[IsGranted('ROLE_USER')] // Requires at least a logged-in user (specific filtering below)
    public function index(OrderRepository $orderRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', self::ITEMS_PER_PAGE);

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
            return $this->json(['message' => 'Unauthorized access to orders.'], Response::HTTP_FORBIDDEN);
        }

        // Apply pagination
        $qb->orderBy('o.created_at', 'DESC')
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

        // Define serialization group e.g., 'order:read:collection'
        $json = $serializer->serialize($data, 'json', ['groups' => 'order:read:collection']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_order_show', methods: ['GET'])]
    #[IsGranted('view', 'order')] // Assumes OrderVoter handles ownership/admin check
    public function show(Order $order, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $order); // Voter checks user/restaurant ownership or admin

        // Define serialization group e.g., 'order:read'
        $json = $serializer->serialize($order, 'json', ['groups' => 'order:read']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('', name: 'api_order_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')] // Only regular users can create orders
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        RestaurantRepository $restaurantRepository,
        ArticleRepository $articleRepository
    ): JsonResponse {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['message' => 'Only registered users can create orders.'], Response::HTTP_FORBIDDEN);
        }

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->json(['errors' => ['json' => 'Invalid JSON payload: ' . $e->getMessage()]], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['restaurantId']) || !isset($data['items'])) {
             return $this->json(['message' => 'Missing required fields: restaurantId, items'], Response::HTTP_BAD_REQUEST);
        }

        $restaurant = $restaurantRepository->find($data['restaurantId']);
        if (!$restaurant) {
            return $this->json(['message' => 'Restaurant not found'], Response::HTTP_BAD_REQUEST);
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
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($order);
        $entityManager->flush();

        $json = $serializer->serialize($order, 'json', ['groups' => 'order:read']);
        return new JsonResponse($json, Response::HTTP_CREATED, [], true);
    }

    #[Route('/{id}', name: 'api_order_update_status', methods: ['PATCH'])]
    // Security check via voter is better to ensure it's the correct restaurant or admin
    #[IsGranted('update_status', 'order')] // Custom voter attribute
    public function updateStatus(
        Request $request,
        Order $order, // The order to update
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        // Voter checks general permission (is owner restaurant? is current state modifiable?)
        $this->denyAccessUnlessGranted('update_status', $order);

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return $this->json(['errors' => ['json' => 'Invalid JSON payload: ' . $e->getMessage()]], Response::HTTP_BAD_REQUEST);
        }

        if (!isset($data['status'])) {
            return $this->json(['message' => 'Missing status field'], Response::HTTP_BAD_REQUEST);
        }

        $newState = $data['status'];
        $currentState = $order->getStatus();

        // Define allowed transitions *for restaurants*
        $allowedTransitions = [
            'pendiente' => ['preparando', 'cancelado'],
            'preparando' => ['entregado', 'cancelado']
            // Cannot transition from 'entregado' or 'cancelado' as restaurant
        ];

        // Check if this specific transition is allowed
        if (!isset($allowedTransitions[$currentState]) || !in_array($newState, $allowedTransitions[$currentState])) {
             return $this->json(['message' => sprintf('Cannot change order status from "%s" to "%s"', $currentState, $newState)], Response::HTTP_BAD_REQUEST);
        }

        $order->setStatus($newState);

        // Validate the whole object (optional, could target specific constraints)
        $errors = $validator->validate($order);
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

    // Delete action likely not needed for orders, maybe only by admin via a dedicated endpoint/flag?

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
