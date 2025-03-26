<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: "secretosFRA")]
class TablaFRA
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer")]
    private int $id;
    #[ORM\Column(type: "string", length: 255)]
    private string $fraseFRA;
    public function getId(): int
    {
        return $this->id;
    }
    public function getFraseFRA(): string
    {
        return $this->fraseFRA;
    }
    public function setFraseFRA(string $content): self
    {
        $this->fraseFRA = $content;
        return $this;
    }
}
