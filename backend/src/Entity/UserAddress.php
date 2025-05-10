<?php

namespace App\Entity;

use App\Repository\UserAddressRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserAddressRepository::class)]
#[ORM\Table(name: 'user_addresses')]
class UserAddress extends Address
{
    #[ORM\Column(type: 'simple_array', nullable: false)]
    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\Type('string'),
        new Assert\Length(min: 1, max: 255)
    ])]
    #[Assert\Count(
        min: 1,
        max: 2,
        minMessage: "You must specify at least one address line.",
        maxMessage: "You cannot specify more than two address lines."
    )]
    protected array $address_line = [];

    // OneToOne because SQL has UNIQUE constraint on user_id
    #[ORM\OneToOne(targetEntity: User::class, inversedBy: 'address')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user = null;

    // --- Getters and Setters ---

    public function getAddressLine(): array
    {
        return $this->address_line;
    }

    public function setAddressLine(array $address_line): static
    {
        $this->address_line = $address_line;
        return $this;
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
} 