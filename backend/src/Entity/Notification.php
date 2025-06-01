<?php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notification:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['notification:read'])]
    private string $type;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['notification:read'])]
    private string $message;

    #[ORM\Column(type: 'string', length: 50)]
    #[Groups(['notification:read'])]
    private string $relatedEntityType;

    #[ORM\Column(type: 'integer')]
    #[Groups(['notification:read'])]
    private int $relatedEntityId;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['notification:read'])]
    private string $recipientType;

    #[ORM\Column(type: 'integer')]
    #[Groups(['notification:read'])]
    private int $recipientId;

    #[ORM\Column(name: 'is_read', type: 'boolean', options: ['default' => false])]
    #[Groups(['notification:read'])]
    private bool $isRead = false;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['notification:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['notification:read'])]
    private ?\DateTimeImmutable $readAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function getRelatedEntityType(): string
    {
        return $this->relatedEntityType;
    }

    public function setRelatedEntityType(string $relatedEntityType): self
    {
        $this->relatedEntityType = $relatedEntityType;
        return $this;
    }

    public function getRelatedEntityId(): int
    {
        return $this->relatedEntityId;
    }

    public function setRelatedEntityId(int $relatedEntityId): self
    {
        $this->relatedEntityId = $relatedEntityId;
        return $this;
    }

    public function getRecipientType(): string
    {
        return $this->recipientType;
    }

    public function setRecipientType(string $recipientType): self
    {
        $this->recipientType = $recipientType;
        return $this;
    }

    public function getRecipientId(): int
    {
        return $this->recipientId;
    }

    public function setRecipientId(int $recipientId): self
    {
        $this->recipientId = $recipientId;
        return $this;
    }

    public function isRead(): bool
    {
        return $this->isRead;
    }

    public function setRead(bool $isRead): self
    {
        $this->isRead = $isRead;
        
        if ($isRead && $this->readAt === null) {
            $this->readAt = new \DateTimeImmutable();
        }
        
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getReadAt(): ?\DateTimeImmutable
    {
        return $this->readAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}