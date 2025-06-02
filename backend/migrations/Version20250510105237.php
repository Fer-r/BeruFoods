<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250510105237 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convert user_addresses address_line field to simple_array type for structured address components';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses CHANGE address_line address_line LONGTEXT NOT NULL COMMENT '(DC2Type:simple_array)'
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE user_addresses CHANGE address_line address_line LONGTEXT NOT NULL
        SQL);
    }
}
