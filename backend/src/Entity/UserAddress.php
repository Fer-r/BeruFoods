<?php

namespace App\Entity;

use App\Repository\UserAddressRepository;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource; // Optional: If you want API Platform support

#[ORM\Entity(repositoryClass: UserAddressRepository::class)]
#[ApiResource]
#[ORM\Table(name: 'user_addresses')]
class UserAddress
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // OneToOne because SQL has UNIQUE constraint on user_id
    #[ORM\OneToOne(targetEntity: User::class, inversedBy: 'address')] // Assuming User will have an 'address' property
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)] // Match foreign key
    private ?User $user = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $address_line = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    private ?string $lat = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    private ?string $lng = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $floor = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $province = null;

    // --- Getters and Setters ---

    public function getId(): ?int
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

    public function getFloor(): ?string
    {
        return $this->floor;
    }

    public function setFloor(?string $floor): static
    {
        $this->floor = $floor;
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