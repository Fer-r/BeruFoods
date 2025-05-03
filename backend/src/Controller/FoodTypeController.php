<?php

namespace App\Controller;

use App\Entity\FoodType;
use App\Repository\FoodTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/food-types')]
final class FoodTypeController extends AbstractController
{
    #[Route('', name: 'api_food_type_index', methods: ['GET'])]
    public function index(FoodTypeRepository $foodTypeRepository, SerializerInterface $serializer): JsonResponse
    {
        $foodTypes = $foodTypeRepository->findBy([], ['name' => 'ASC']);

        // No need to manually add imageUrl
        $json = $serializer->serialize($foodTypes, 'json', ['groups' => 'foodtype:read:collection']);

        // Directly return serialized data
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('', name: 'api_food_type_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $foodType = new FoodType();
        $data = json_decode($request->getContent(), true); // Decode JSON payload

        if (!isset($data['name'])) {
             return $this->json(['errors' => ['name' => 'Name is required']], Response::HTTP_BAD_REQUEST);
        }

        $foodType->setName($data['name']);

        $errors = $validator->validate($foodType);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                 $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($foodType);
        $entityManager->flush();

        // Serialize the created object for response
        $json = $serializer->serialize($foodType, 'json', ['groups' => 'foodtype:read']);

        return new JsonResponse($json, Response::HTTP_CREATED, [], true);
    }

    #[Route('/{id}', name: 'api_food_type_show', methods: ['GET'])]
    public function show(FoodType $foodType, SerializerInterface $serializer): JsonResponse
    {
        $json = $serializer->serialize($foodType, 'json', ['groups' => 'foodtype:read']);

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    // Using PUT for update now as we expect JSON
    #[Route('/{id}', name: 'api_food_type_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        Request $request,
        FoodType $foodType,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        SerializerInterface $serializer
    ): JsonResponse {

        $data = json_decode($request->getContent(), true);

        // Only update name if provided in the JSON payload
        if (isset($data['name'])) {
             $foodType->setName($data['name']);
        }

        $errors = $validator->validate($foodType);
        if (count($errors) > 0) {
             $errorMessages = [];
             foreach ($errors as $error) {
                  $errorMessages[$error->getPropertyPath()][] = $error->getMessage();
             }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->flush();

        // Serialize the updated object for response
        $json = $serializer->serialize($foodType, 'json', ['groups' => 'foodtype:read']);

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_food_type_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(FoodType $foodType, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($foodType);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
