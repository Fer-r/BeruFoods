<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250422233630 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates comprehensive schema for restaurant management system including users, restaurants, food types, orders, and addresses';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE allergies (id INT AUTO_INCREMENT NOT NULL, name LONGTEXT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE articles (id INT AUTO_INCREMENT NOT NULL, restaurant_id INT DEFAULT NULL, name LONGTEXT NOT NULL, description LONGTEXT NOT NULL, image LONGTEXT NOT NULL, listed TINYINT(1) DEFAULT 1 NOT NULL, price NUMERIC(10, 2) NOT NULL, allergies JSON NOT NULL, available TINYINT(1) DEFAULT 1 NOT NULL, INDEX IDX_BFDD3168B1E7706E (restaurant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE food_types (id INT AUTO_INCREMENT NOT NULL, name LONGTEXT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE orders (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, restaurant_id INT DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, status LONGTEXT NOT NULL, total_price NUMERIC(10, 2) NOT NULL, deleted_at DATETIME DEFAULT NULL, items JSON NOT NULL, INDEX IDX_E52FFDEEA76ED395 (user_id), INDEX IDX_E52FFDEEB1E7706E (restaurant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE reservations (id INT AUTO_INCREMENT NOT NULL, restaurant_id INT DEFAULT NULL, user_id INT DEFAULT NULL, reservation_datetime DATETIME DEFAULT NULL, state LONGTEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, INDEX IDX_4DA239B1E7706E (restaurant_id), INDEX IDX_4DA239A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE restaurant_addresses (id INT AUTO_INCREMENT NOT NULL, restaurant_id INT NOT NULL, address_line LONGTEXT NOT NULL, lat NUMERIC(10, 7) NOT NULL, lng NUMERIC(10, 7) NOT NULL, province LONGTEXT NOT NULL, UNIQUE INDEX UNIQ_5F5F2F31B1E7706E (restaurant_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE restaurants (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, name LONGTEXT NOT NULL, phone LONGTEXT NOT NULL, banned TINYINT(1) DEFAULT 0 NOT NULL, deleted_at DATETIME DEFAULT NULL, takes_reservations TINYINT(1) DEFAULT 0 NOT NULL, table_count INT DEFAULT NULL, UNIQUE INDEX UNIQ_RESTAURANT_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE restaurant_food_types (restaurant_id INT NOT NULL, food_type_id INT NOT NULL, INDEX IDX_D6B6CEBB1E7706E (restaurant_id), INDEX IDX_D6B6CEB8AD350AB (food_type_id), PRIMARY KEY(restaurant_id, food_type_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_addresses (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, address_line LONGTEXT NOT NULL, lat NUMERIC(10, 7) NOT NULL, lng NUMERIC(10, 7) NOT NULL, floor LONGTEXT DEFAULT NULL, province LONGTEXT NOT NULL, UNIQUE INDEX UNIQ_6F2AF8F2A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, name LONGTEXT NOT NULL, phone LONGTEXT NOT NULL, banned TINYINT(1) DEFAULT 0 NOT NULL, deleted_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE articles ADD CONSTRAINT FK_BFDD3168B1E7706E FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEEA76ED395 FOREIGN KEY (user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEEB1E7706E FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations ADD CONSTRAINT FK_4DA239B1E7706E FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations ADD CONSTRAINT FK_4DA239A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses ADD CONSTRAINT FK_5F5F2F31B1E7706E FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_food_types ADD CONSTRAINT FK_D6B6CEBB1E7706E FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_food_types ADD CONSTRAINT FK_D6B6CEB8AD350AB FOREIGN KEY (food_type_id) REFERENCES food_types (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses ADD CONSTRAINT FK_6F2AF8F2A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE restaurant
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, roles JSON NOT NULL, password VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = ''
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE restaurant (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, password VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, roles JSON NOT NULL, UNIQUE INDEX UNIQ_RESTAURANT_EMAIL (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = ''
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE articles DROP FOREIGN KEY FK_BFDD3168B1E7706E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEEA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEEB1E7706E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239B1E7706E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses DROP FOREIGN KEY FK_5F5F2F31B1E7706E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_food_types DROP FOREIGN KEY FK_D6B6CEBB1E7706E
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_food_types DROP FOREIGN KEY FK_D6B6CEB8AD350AB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses DROP FOREIGN KEY FK_6F2AF8F2A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE allergies
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE articles
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE food_types
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE orders
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE reservations
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE restaurant_addresses
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE restaurants
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE restaurant_food_types
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_addresses
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE users
        SQL);
    }
}
