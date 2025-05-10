<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\MappedSuperclass]
class Address
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    protected ?int $id = null;

    #[ORM\Column(type: 'text', nullable: false)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 500)]
    protected ?string $address_line = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    protected ?string $province = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    #[Assert\NotBlank]
    #[Assert\Range(min: -90, max: 90)]
    protected ?string $lat = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 7, nullable: false)]
    #[Assert\NotBlank]
    #[Assert\Range(min: -180, max: 180)]
    protected ?string $lng = null;


    public function getId(): ?int
    {
        return $this->id;
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

    public function getProvince(): ?string
    {
        return $this->province;
    }

    public function setProvince(?string $province): static
    {
        $this->province = $province;
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
} 