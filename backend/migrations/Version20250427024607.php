<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250427024607 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE articles ADD image_filename VARCHAR(255) DEFAULT NULL, DROP image, CHANGE restaurant_id restaurant_id INT NOT NULL, CHANGE description description LONGTEXT DEFAULT NULL, CHANGE allergies allergies JSON DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders CHANGE user_id user_id INT NOT NULL, CHANGE restaurant_id restaurant_id INT NOT NULL, CHANGE created_at created_at DATETIME NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations ADD confirmation_code VARCHAR(16) DEFAULT NULL, CHANGE restaurant_id restaurant_id INT NOT NULL, CHANGE user_id user_id INT NOT NULL, CHANGE reservation_datetime reservation_datetime DATETIME NOT NULL, CHANGE created_at created_at DATETIME NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_4DA239A0E239DE ON reservations (confirmation_code)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurants ADD opening_time TIME DEFAULT NULL, ADD closing_time TIME DEFAULT NULL, ADD reservation_duration INT DEFAULT NULL, ADD image_filename VARCHAR(255) DEFAULT NULL, CHANGE name name LONGTEXT DEFAULT NULL, CHANGE phone phone LONGTEXT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses ADD city VARCHAR(100) NOT NULL, ADD postal_code VARCHAR(20) NOT NULL, ADD country VARCHAR(100) NOT NULL, CHANGE province province VARCHAR(100) NOT NULL, CHANGE address_line street LONGTEXT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users CHANGE name name LONGTEXT DEFAULT NULL, CHANGE phone phone LONGTEXT DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_4DA239A0E239DE ON reservations
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations DROP confirmation_code, CHANGE restaurant_id restaurant_id INT DEFAULT NULL, CHANGE user_id user_id INT DEFAULT NULL, CHANGE reservation_datetime reservation_datetime DATETIME DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurants DROP opening_time, DROP closing_time, DROP reservation_duration, DROP image_filename, CHANGE name name LONGTEXT NOT NULL, CHANGE phone phone LONGTEXT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses DROP city, DROP postal_code, DROP country, CHANGE province province LONGTEXT NOT NULL, CHANGE street address_line LONGTEXT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders CHANGE user_id user_id INT DEFAULT NULL, CHANGE restaurant_id restaurant_id INT DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE articles ADD image LONGTEXT NOT NULL, DROP image_filename, CHANGE restaurant_id restaurant_id INT DEFAULT NULL, CHANGE description description LONGTEXT NOT NULL, CHANGE allergies allergies JSON NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users CHANGE name name LONGTEXT NOT NULL, CHANGE phone phone LONGTEXT NOT NULL
        SQL);
    }
}
