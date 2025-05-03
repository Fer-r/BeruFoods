<?php

namespace App\Controller;

use App\Entity\RestaurantAddress;
use App\Form\RestaurantAddressType;
use App\Repository\RestaurantAddressRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/restaurant/address')]
final class RestaurantAddressController extends AbstractController
{
    #[Route(name: 'app_restaurant_address_index', methods: ['GET'])]
    public function index(RestaurantAddressRepository $restaurantAddressRepository): Response
    {
        return $this->render('restaurant_address/index.html.twig', [
            'restaurant_addresses' => $restaurantAddressRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_restaurant_address_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $restaurantAddress = new RestaurantAddress();
        $form = $this->createForm(RestaurantAddressType::class, $restaurantAddress);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($restaurantAddress);
            $entityManager->flush();

            return $this->redirectToRoute('app_restaurant_address_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('restaurant_address/new.html.twig', [
            'restaurant_address' => $restaurantAddress,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_restaurant_address_show', methods: ['GET'])]
    public function show(RestaurantAddress $restaurantAddress): Response
    {
        return $this->render('restaurant_address/show.html.twig', [
            'restaurant_address' => $restaurantAddress,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_restaurant_address_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, RestaurantAddress $restaurantAddress, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(RestaurantAddressType::class, $restaurantAddress);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_restaurant_address_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('restaurant_address/edit.html.twig', [
            'restaurant_address' => $restaurantAddress,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_restaurant_address_delete', methods: ['POST'])]
    public function delete(Request $request, RestaurantAddress $restaurantAddress, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$restaurantAddress->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($restaurantAddress);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_restaurant_address_index', [], Response::HTTP_SEE_OTHER);
    }
}
