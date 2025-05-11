<?php

namespace App\Entity;

use App\Repository\RestaurantAddressRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
// Assert import might be needed if RestaurantAddress adds specific constraints
// For now, assuming common constraints are in Address base class

#[ORM\Entity(repositoryClass: RestaurantAddressRepository::class)]
#[ORM\Table(name: 'restaurant_addresses')]
class RestaurantAddress extends Address 
{
    #[ORM\Column(type: 'text', nullable: false)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 500)] // Standard string validation
    protected string $address_line;

    // Id is inherited from Address.

    // OneToOne because SQL has UNIQUE constraint on restaurant_id
    #[ORM\OneToOne(targetEntity: Restaurant::class, inversedBy: 'address')]
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id', nullable: false)]
    private ?Restaurant $restaurant = null;

    public function getAddressLine(): string
    {
        return $this->address_line;
    }

    public function setAddressLine(string $address_line): static
    {
        $this->address_line = $address_line;
        return $this;
    }

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