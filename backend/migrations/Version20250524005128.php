<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250524005128 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Change province to city in user_addresses and remove province/city from restaurant_addresses';
    }

    public function up(Schema $schema): void
    {
        // Change province to city in user_addresses
        $this->addSql('ALTER TABLE user_addresses CHANGE province city VARCHAR(100) NOT NULL');
        
        // Remove province column from restaurant_addresses (restaurants don't use city)
        $this->addSql('ALTER TABLE restaurant_addresses DROP COLUMN province');
    }

    public function down(Schema $schema): void
    {
        // Revert user_addresses: change city back to province
        $this->addSql('ALTER TABLE user_addresses CHANGE city province VARCHAR(100) NOT NULL');
        
        // Add province column back to restaurant_addresses
        $this->addSql('ALTER TABLE restaurant_addresses ADD COLUMN province VARCHAR(100) NOT NULL DEFAULT ""');
    }
}
