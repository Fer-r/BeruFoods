<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250601000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create notification table for persistent notifications';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notification (
            id INT AUTO_INCREMENT NOT NULL,
            type VARCHAR(50) NOT NULL,
            message VARCHAR(255) NOT NULL,
            related_entity_type VARCHAR(50) NOT NULL,
            related_entity_id INT NOT NULL,
            recipient_type VARCHAR(20) NOT NULL,
            recipient_id INT NOT NULL,
            is_read TINYINT(1) DEFAULT 0 NOT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            read_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        
        $this->addSql('CREATE INDEX idx_notification_recipient ON notification (recipient_type, recipient_id, is_read)');
        $this->addSql('CREATE INDEX idx_notification_recipient_date ON notification (recipient_type, recipient_id, created_at)');
        $this->addSql('CREATE INDEX idx_notification_related_entity ON notification (related_entity_type, related_entity_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE notification');
    }
}