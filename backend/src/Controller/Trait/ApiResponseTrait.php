<?php

namespace App\Controller\Trait;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Serializer\SerializerInterface;

trait ApiResponseTrait
{
    protected function apiSuccessResponse($data, int $statusCode = Response::HTTP_OK, array $groups = [], array $headers = []): JsonResponse
    {
        if (!$this instanceof \Symfony\Bundle\FrameworkBundle\Controller\AbstractController) {
            throw new \LogicException(sprintf('The %s trait can only be used in classes that extend AbstractController.', __TRAIT__));
        }
        
        /** @var SerializerInterface $serializer */
        $serializer = $this->container->get('serializer'); // Ensure serializer is available
        $json = $serializer->serialize($data, 'json', array_merge(['groups' => $groups], $this->getSerializationContext()));
        return new JsonResponse($json, $statusCode, $headers, true);
    }

    protected function apiErrorResponse(string $message, int $statusCode, ?array $errors = null): JsonResponse
    {
        $data = ['message' => $message];
        if ($errors !== null) {
            $data['errors'] = $errors;
        }
        return new JsonResponse($data, $statusCode);
    }

    protected function apiValidationErrorResponse(ConstraintViolationListInterface $violations): JsonResponse
    {
        $errorMessages = [];
        foreach ($violations as $violation) {
            $errorMessages[$violation->getPropertyPath()][] = $violation->getMessage();
        }
        return $this->apiErrorResponse('Validation failed', Response::HTTP_BAD_REQUEST, $errorMessages);
    }
    
    /**
     * Provides a hook for controllers to add to the serialization context.
     */
    protected function getSerializationContext(): array
    {
        return []; // Default empty context
    }
} 