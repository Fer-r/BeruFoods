<?php

namespace App\Controller;

use App\Entity\Allergy;
use App\Repository\AllergyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[Route('/api/allergies')]
final class AllergyController extends AbstractController
{
    #[Route('', name: 'api_allergy_index', methods: ['GET'])]
    public function index(AllergyRepository $allergyRepository, SerializerInterface $serializer): JsonResponse
    {
        $allergies = $allergyRepository->findBy([], ['name' => 'ASC']);
        $json = $serializer->serialize($allergies, 'json', ['groups' => 'allergy:read:collection']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('', name: 'api_allergy_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $allergy = new Allergy();
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'])) {
             return $this->json(['errors' => ['name' => 'Name is required']], Response::HTTP_BAD_REQUEST);
        }
        $allergy->setName($data['name']);

        // Add validation for the name property if needed
        $nameConstraint = new Assert\NotBlank();
        $errors = $validator->validate($data['name'], $nameConstraint);

        if (count($errors) > 0) {
             $errorMessages = [];
             // Directly use the message from the constraint violation
             foreach ($errors as $error) {
                 $errorMessages['name'][] = $error->getMessage();
             }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($allergy);
        $entityManager->flush();

        $json = $serializer->serialize($allergy, 'json', ['groups' => 'allergy:read']);
        return new JsonResponse($json, Response::HTTP_CREATED, [], true);
    }

    #[Route('/{id}', name: 'api_allergy_show', methods: ['GET'])]
    public function show(Allergy $allergy, SerializerInterface $serializer): JsonResponse
    {
        $json = $serializer->serialize($allergy, 'json', ['groups' => 'allergy:read']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_allergy_update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        Request $request,
        Allergy $allergy,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        SerializerInterface $serializer
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'])) {
            return $this->json(['errors' => ['name' => 'Name is required']], Response::HTTP_BAD_REQUEST);
        }

        // Add validation for the name property if needed
        $nameConstraint = new Assert\NotBlank();
        $errors = $validator->validate($data['name'], $nameConstraint);

        if (count($errors) > 0) {
             $errorMessages = [];
             foreach ($errors as $error) {
                 $errorMessages['name'][] = $error->getMessage();
             }
             return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $allergy->setName($data['name']);
        $entityManager->flush();

        $json = $serializer->serialize($allergy, 'json', ['groups' => 'allergy:read']);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'api_allergy_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Allergy $allergy, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($allergy);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
