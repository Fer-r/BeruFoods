<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250518200218 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop the allergies table and modify the status column in the orders table to VARCHAR(15) with default pending.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            DROP TABLE allergies
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders CHANGE status status VARCHAR(15) DEFAULT 'pending' NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE allergies (id INT AUTO_INCREMENT NOT NULL, name LONGTEXT CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders CHANGE status status LONGTEXT NOT NULL
        SQL);
    }
}
