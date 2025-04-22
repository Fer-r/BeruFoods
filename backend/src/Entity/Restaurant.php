<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\RestaurantRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: RestaurantRepository::class)]
#[ApiResource]
#[ORM\Table(name: 'restaurants')]
#[ORM\UniqueConstraint(name: 'UNIQ_RESTAURANT_EMAIL', fields: ['email'])]
class Restaurant implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    private ?string $password = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $name = null;

    #[ORM\Column(type: 'text', nullable: false)]
    private ?string $phone = null;

    #[ORM\Column(type: 'boolean', options:["default" => false])]
    private ?bool $banned = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $deleted_at = null;

    #[ORM\Column(type: 'boolean', options:["default" => false])]
    private ?bool $takes_reservations = false;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $table_count = null;

    #[ORM\OneToOne(mappedBy: 'restaurant', targetEntity: RestaurantAddress::class, cascade: ['persist', 'remove'])]
    private ?RestaurantAddress $address = null;

    /**
     * @var Collection<int, FoodType>
     */
    #[ORM\ManyToMany(targetEntity: FoodType::class)]
    #[ORM\JoinTable(name: 'restaurant_food_types')]
    #[ORM\JoinColumn(name: 'restaurant_id', referencedColumnName: 'id')]
    #[ORM\InverseJoinColumn(name: 'food_type_id', referencedColumnName: 'id')]
    private Collection $foodTypes;

    public function __construct()
    {
        $this->foodTypes = new ArrayCollection();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_RESTAURANT';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
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

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;
        return $this;
    }

    public function isBanned(): ?bool
    {
        return $this->banned;
    }

    public function setBanned(bool $banned): static
    {
        $this->banned = $banned;
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

    public function isTakesReservations(): ?bool
    {
        return $this->takes_reservations;
    }

    public function setTakesReservations(?bool $takes_reservations): static
    {
        $this->takes_reservations = $takes_reservations;
        return $this;
    }

    public function getTableCount(): ?int
    {
        return $this->table_count;
    }

    public function setTableCount(?int $table_count): static
    {
        $this->table_count = $table_count;
        return $this;
    }

    public function getAddress(): ?RestaurantAddress
    {
        return $this->address;
    }

    public function setAddress(?RestaurantAddress $address): static
    {
        if ($address !== null && $address->getRestaurant() !== $this) {
            $address->setRestaurant($this);
        }

        $this->address = $address;
        return $this;
    }

    /**
     * @return Collection<int, FoodType>
     */
    public function getFoodTypes(): Collection
    {
        return $this->foodTypes;
    }

    public function addFoodType(FoodType $foodType): static
    {
        if (!$this->foodTypes->contains($foodType)) {
            $this->foodTypes->add($foodType);
        }

        return $this;
    }

    public function removeFoodType(FoodType $foodType): static
    {
        $this->foodTypes->removeElement($foodType);

        return $this;
    }
}
