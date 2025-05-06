<?php

namespace App\Entity;

use App\Repository\RestaurantAddressRepository;
use Doctrine\ORM\Mapping as ORM;
// Assert import might be needed if RestaurantAddress adds specific constraints
// For now, assuming common constraints are in Address base class

#[ORM\Entity(repositoryClass: RestaurantAddressRepository::class)]
#[ORM\Table(name: 'restaurant_addresses')]
class RestaurantAddress extends Address 
{
    // Id is inherited from Address.

    // OneToOne because SQL has UNIQUE constraint on restaurant_id
    #[ORM\OneToOne(targetEntity: Restaurant::class, inversedBy: 'address')]
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id', nullable: false)]
    private ?Restaurant $restaurant = null;

    public function getRestaurant(): ?Restaurant
    {
        return $this->restaurant;
    }

    public function setRestaurant(?Restaurant $restaurant): static
    {
        $this->restaurant = $restaurant;
        return $this;
    }

} 