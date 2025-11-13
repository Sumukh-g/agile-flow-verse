-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channels" TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "source" TEXT,
    "category" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_tenantId_fkey'
    ) THEN
        ALTER TABLE "notifications" 
        ADD CONSTRAINT "notifications_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_userId_fkey'
    ) THEN
        ALTER TABLE "notifications" 
        ADD CONSTRAINT "notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

-- Add archived fields to notifications (if table already existed)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "notifications_tenantId_userId_idx" ON "notifications"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "notifications_read_archived_idx" ON "notifications"("read", "archived");

-- Create notification_services table
CREATE TABLE IF NOT EXISTS "notification_services" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bell',
    "color" TEXT NOT NULL DEFAULT 'bg-gray-500',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_services_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for notification services
CREATE UNIQUE INDEX IF NOT EXISTS "notification_services_tenantId_userId_name_key" ON "notification_services"("tenantId", "userId", "name");

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "notification_services_tenantId_userId_idx" ON "notification_services"("tenantId", "userId");

-- Insert default notification services for existing users
INSERT INTO "notification_services" ("id", "tenantId", "userId", "name", "icon", "color", "category", "enabled", "connected", "settings", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    u."tenantId",
    u."id",
    service.name,
    service.icon,
    service.color,
    service.category,
    true,
    false,
    '{}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN (
    VALUES 
        ('Gmail', 'Mail', 'bg-blue-500', 'Work'),
        ('Slack', 'Slack', 'bg-purple-500', 'Work'),
        ('Teams', 'MessageSquare', 'bg-indigo-500', 'Important')
) AS service(name, icon, color, category)
ON CONFLICT DO NOTHING;

