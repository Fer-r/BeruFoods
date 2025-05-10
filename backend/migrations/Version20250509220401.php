<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250509220401 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update restaurant_addresses province type and simplify user_addresses schema';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses CHANGE province province VARCHAR(100) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses DROP floor, DROP city, DROP postal_code, DROP country, CHANGE street address_line LONGTEXT NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses CHANGE province province LONGTEXT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses ADD floor LONGTEXT DEFAULT NULL, ADD city VARCHAR(100) NOT NULL, ADD postal_code VARCHAR(20) NOT NULL, ADD country VARCHAR(100) NOT NULL, CHANGE address_line street LONGTEXT NOT NULL
        SQL);
    }
}
