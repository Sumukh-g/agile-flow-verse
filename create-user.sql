-- Create demo tenant if not exists
INSERT INTO tenants (id, name, slug, sku, "createdAt", "updatedAt")
VALUES ('demo-tenant-id', 'Demo Company', 'demo', 'enterprise', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Create demo user with hashed password for 'demo123'
-- Password hash for 'demo123' using bcrypt rounds=10
INSERT INTO users (id, email, name, password, "tenantId", "createdAt", "updatedAt")
VALUES (
  'demo-user-id',
  'demo@example.com',
  'Demo User',
  '$2b$10$rJYnB.8H9F.8p5YxZ0K5d.VVqJ9nZ0qGZ8QG0L1H8qJ0K5d0K5d0K',
  'demo-tenant-id',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = '$2b$10$rJYnB.8H9F.8p5YxZ0K5d.VVqJ9nZ0qGZ8QG0L1H8qJ0K5d0K5d0K',
  "updatedAt" = NOW();

