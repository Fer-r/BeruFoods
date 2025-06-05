<?php

namespace App\Controller;

use App\Controller\Trait\ApiResponseTrait;
use App\Controller\Trait\PaginationTrait;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
final class UserController extends AbstractController
{
    use PaginationTrait;
    use ApiResponseTrait;

    #[Route('/users', name: 'api_user_index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(UserRepository $userRepository, Request $request): JsonResponse
    {
        $qb = $userRepository->createQueryBuilder('u');

        $qb->orderBy('u.email', 'ASC');

        $paginationData = $this->paginate($qb, $request);

        return $this->apiSuccessResponse($paginationData, Response::HTTP_OK, ['user:read:collection']);
    }

    #[Route('/users/{id}', name: 'api_user_show', methods: ['GET'])]
    #[IsGranted('view', 'user')]
    public function show(User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('view', $user);

        return $this->apiSuccessResponse($user, Response::HTTP_OK, ['user:read']);
    }

    #[Route('/users/{id}', name: 'api_user_update', methods: ['PUT', 'PATCH'])]
    #[IsGranted('edit', 'user')]
    public function update(
        Request $request,
        User $user,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $this->denyAccessUnlessGranted('edit', $user);

        $jsonData = json_decode($request->getContent(), true);

        if ($jsonData === null && json_last_error() !== JSON_ERROR_NONE) {
            return $this->apiErrorResponse('Invalid JSON payload.', Response::HTTP_BAD_REQUEST, ['json_error' => json_last_error_msg()]);
        }

        $_entityWasModified_ = false;

        // Handle basic fields
        $allowedFieldsToUpdate = [
            'name' => 'setName',
            'phone' => 'setPhone',
        ];

        // Handle roles (only for admins)
        if (array_key_exists('roles', $jsonData) && $this->isGranted('ROLE_ADMIN')) {
            $newRoles = is_array($jsonData['roles']) ? $jsonData['roles'] : [];
            $currentRoles = $user->getRoles();
            // Remove ROLE_USER for comparison as it's always added
            $currentRolesFiltered = array_filter($currentRoles, fn($role) => $role !== 'ROLE_USER');
            $newRolesFiltered = array_filter($newRoles, fn($role) => $role !== 'ROLE_USER');
            
            if (array_diff($currentRolesFiltered, $newRolesFiltered) !== array_diff($newRolesFiltered, $currentRolesFiltered)) {
                $user->setRoles($newRoles);
                $_entityWasModified_ = true;
            }
        }

        foreach ($allowedFieldsToUpdate as $field => $setterMethod) {
            if (array_key_exists($field, $jsonData)) {
                $newValue = $jsonData[$field];
                $getterMethod = 'get' . substr($setterMethod, 3); // Convert setName to getName
                
                if (method_exists($user, $getterMethod) && method_exists($user, $setterMethod)) {
                    $currentValue = $user->$getterMethod();
                    if ($currentValue !== $newValue) {
                        $user->$setterMethod($newValue);
                        $_entityWasModified_ = true;
                }
            }
        }
        }

        // Note: Email is deliberately not included in updatable fields for security reasons

        // Handle address updates
        if (isset($jsonData['address']) && is_array($jsonData['address'])) {
            $addressData = $jsonData['address'];
            $userAddress = $user->getAddress();

            if (!$userAddress) {
                $userAddressClassName = \App\Entity\UserAddress::class; 
                if (class_exists($userAddressClassName)) {
                    $userAddress = new $userAddressClassName();
                    $userAddress->setUser($user); 
                    $_entityWasModified_ = true;
                } else {
                    return $this->apiErrorResponse('UserAddress entity not configured correctly.', Response::HTTP_INTERNAL_SERVER_ERROR);
                }
            }

            if ($userAddress) {
                $allowedAddressFieldsToUpdate = [
                    'address_line' => 'setAddressLine',
                    'city' => 'setCity',
                    'lat' => 'setLat',
                    'lng' => 'setLng',
                ];

                foreach ($allowedAddressFieldsToUpdate as $field => $setterMethod) {
                    if (array_key_exists($field, $addressData)) {
                        $getterMethod = 'get' . ucfirst(str_replace('_', '', ucwords($field, '_')));
                        if (method_exists($userAddress, $getterMethod) && method_exists($userAddress, $setterMethod)) {
                            $currentValue = $userAddress->$getterMethod();
                            $newValue = $addressData[$field];
                            if ($currentValue !== $newValue) {
                                $userAddress->$setterMethod($newValue);
                                $_entityWasModified_ = true;
                            }
                        }
                    }
                }
                $user->setAddress($userAddress);
            }
        } elseif (array_key_exists('address', $jsonData) && $jsonData['address'] === null) {
            if ($user->getAddress() !== null) {
            $user->setAddress(null);
                $_entityWasModified_ = true;
            }
        }

        // Handle password changes
        if (isset($jsonData['password'])) {
             if (strlen($jsonData['password']) >= 6) {
                  $hashedPassword = $passwordHasher->hashPassword($user, $jsonData['password']);
                  $user->setPassword($hashedPassword);
                $_entityWasModified_ = true;
             } else {
                 return $this->apiErrorResponse('Password validation failed', Response::HTTP_BAD_REQUEST, ['password' => ['Password must be at least 6 characters long']]);
             }
        }

        // Validate the user entity
        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            return $this->apiValidationErrorResponse($errors);
        }

        // Return appropriate response based on whether changes were made
        if (!$_entityWasModified_) {
            return $this->apiSuccessResponse($user, Response::HTTP_OK, ['user:read']);
        }

        try {
        $entityManager->flush();
        } catch (\Exception $e) {
            return $this->apiErrorResponse('An error occurred while saving changes.', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->apiSuccessResponse($user, Response::HTTP_OK, ['user:read']);
    }

    #[Route('/users/{id}', name: 'api_user_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $entityManager->remove($user);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/users/{id}/ban', name: 'api_user_ban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function ban(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $user->setBanned(true);
        $entityManager->flush();
        return $this->apiSuccessResponse(['message' => 'User banned successfully.'], Response::HTTP_OK);
    }

    #[Route('/users/{id}/unban', name: 'api_user_unban', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN')]
    public function unban(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $user->setBanned(false);
        $entityManager->flush();
        return $this->apiSuccessResponse(['message' => 'User unbanned successfully.'], Response::HTTP_OK);
    }
}
