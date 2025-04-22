<?php

namespace App\Entity;

use App\Repository\ArticleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource; // Optional

#[ORM\Entity(repositoryClass: ArticleRepository::class)]
#[ORM\Table(name: 'articles')]
#[ApiResource]
class Article
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Restaurant::class)] // Assuming relationship to Restaurant
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id', nullable: true)]
    private ?Restaurant $restaurant = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $name = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $description = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $image = null;

    #[ORM\Column(type: 'boolean', options: ["default" => true])]
    private ?bool $listed = true;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: false)]
    private ?string $price = null;

    #[ORM\Column(type: 'json', nullable: false)]
    private ?array $allergies = null; // Stored as JSON as per SQL

    #[ORM\Column(type: 'boolean', options: ["default" => true])]
    private ?bool $available = true;

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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;
        return $this;
    }

    public function isListed(): ?bool
    {
        return $this->listed;
    }

    public function setListed(?bool $listed): static
    {
        $this->listed = $listed;
        return $this;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(?string $price): static
    {
        $this->price = $price;
        return $this;
    }

    public function getAllergies(): ?array
    {
        return $this->allergies;
    }

    public function setAllergies(?array $allergies): static
    {
        $this->allergies = $allergies;
        return $this;
    }

    public function isAvailable(): ?bool
    {
        return $this->available;
    }

    public function setAvailable(bool $available): static
    {
        $this->available = $available;
        return $this;
    }
}
