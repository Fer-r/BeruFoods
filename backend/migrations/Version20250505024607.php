<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250505024607 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
       
        $this->addSql(<<<'SQL'
            INSERT INTO food_types (name) VALUES
            ('Italian'), ('Mexican'), ('Chinese'), ('Indian'), ('Japanese'),
            ('Thai'), ('French'), ('Spanish'), ('Greek'), ('American'),
            ('Pizza'), ('Burgers'), ('Seafood'), ('Vegetarian'), ('Vegan');
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            DELETE FROM food_types WHERE name IN (
                'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese',
                'Thai', 'French', 'Spanish', 'Greek', 'American',
                'Pizza', 'Burgers', 'Seafood', 'Vegetarian', 'Vegan'
            );
        SQL);
    }
}
