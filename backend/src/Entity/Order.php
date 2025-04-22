<?php

namespace App\Entity;

use App\Repository\OrderRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource; // Optional

use function Symfony\Component\Clock\now;

#[ORM\Entity(repositoryClass: OrderRepository::class)]
#[ORM\Table(name: 'orders')] // Match table name
#[ApiResource]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)] // Relationship to User
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Restaurant::class)] // Relationship to Restaurant
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id', nullable: true)]
    private ?Restaurant $restaurant = null;

    #[ORM\Column(type: 'datetime', nullable: false, options: ["default" => "CURRENT_TIMESTAMP"])] // Match timestamp without time zone
    private ?\DateTimeInterface $created_at = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $status = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, nullable: false)]
    private ?string $total_price = null;

    #[ORM\Column(type: 'datetime', nullable: true)] // For soft delete
    private ?\DateTimeInterface $deleted_at = null;

    #[ORM\Column(type: 'json', nullable: false)] // Items stored as JSON
    private ?array $items = null;

    // --- Getters and Setters ---

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
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

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->created_at;
    }

    public function setCreatedAt(?\DateTimeInterface $created_at): static
    {
        $this->created_at = $created_at;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(?string $status): static
    {
        // Optional: Add validation based on CHECK constraint ('pendiente', 'preparando', 'entregado', 'cancelado')
        $this->status = $status;
        return $this;
    }

    public function getTotalPrice(): ?string
    {
        return $this->total_price;
    }

    public function setTotalPrice(?string $total_price): static
    {
        $this->total_price = $total_price;
        return $this;
    }

    public function getDeletedAt(): ?\DateTimeInterface
    {
        return $this->deleted_at;
    }

    public function setDeletedAt(?\DateTimeInterface $deleted_at): static
    {
        $this->deleted_at = $deleted_at;
        return $this;
    }

    public function getItems(): ?array
    {
        return $this->items;
    }

    public function setItems(?array $items): static
    {
        $this->items = $items;
        return $this;
    }
} 