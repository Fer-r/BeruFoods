<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250604223104 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add missing city column to restaurant_addresses and remove duplicate notification indexes';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            DROP INDEX idx_notification_related_entity ON notification
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_notification_recipient_date ON notification
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX idx_notification_recipient ON notification
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses ADD city VARCHAR(100) NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE INDEX idx_notification_related_entity ON notification (related_entity_type, related_entity_id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX idx_notification_recipient_date ON notification (recipient_type, recipient_id, created_at)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX idx_notification_recipient ON notification (recipient_type, recipient_id, is_read)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE restaurant_addresses DROP city
        SQL);
    }
}
