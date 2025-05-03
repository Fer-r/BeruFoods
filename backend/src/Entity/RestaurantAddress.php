<?php

namespace App\Entity;

use App\Repository\RestaurantAddressRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RestaurantAddressRepository::class)]
#[ORM\Table(name: 'restaurant_addresses')]
class RestaurantAddress
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // OneToOne because SQL has UNIQUE constraint on restaurant_id
    #[ORM\OneToOne(targetEntity: Restaurant::class, inversedBy: 'address')] // Assuming Restaurant will have an 'address' property
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id', nullable: false)] // Match foreign key
    private ?Restaurant $restaurant = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $address_line = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    private ?string $lat = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    private ?string $lng = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $province = null;

    // --- Getters and Setters ---

    public function getId(): ?int
    {
        return $this->id;
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

    public function getAddressLine(): ?string
    {
        return $this->address_line;
    }

    public function setAddressLine(?string $address_line): static
    {
        $this->address_line = $address_line;
        return $this;
    }

    public function getLat(): ?string
    {
        return $this->lat;
    }

    public function setLat(?string $lat): static
    {
        $this->lat = $lat;
        return $this;
    }

    public function getLng(): ?string
    {
        return $this->lng;
    }

    public function setLng(?string $lng): static
    {
        $this->lng = $lng;
        return $this;
    }

    public function getProvince(): ?string
    {
        return $this->province;
    }

    public function setProvince(?string $province): static
    {
        $this->province = $province;
        return $this;
    }
} 