# Database Access Guide

## PostgreSQL Database Connection

Your application uses PostgreSQL as the database. Here are several ways to access it:

### 1. Using Prisma Studio (Recommended - Visual Interface)

Prisma Studio provides a visual interface to browse and edit your database:

```bash
npx prisma studio
```

This will open a browser window (usually at `http://localhost:5555`) where you can:
- View all tables
- Browse records
- Edit data directly
- See relationships between tables

### 2. Using psql (Command Line)

If you have PostgreSQL installed locally, you can connect using:

```bash
psql -h localhost -p 5432 -U your_username -d agileflow_db
```

The connection details are in your `.env` file:
- **Host**: `localhost` (or from `DATABASE_URL`)
- **Port**: `5432` (default PostgreSQL port)
- **Database**: `agileflow_db` (or from `DATABASE_URL`)
- **Username/Password**: From your `DATABASE_URL` environment variable

### 3. Using Database GUI Tools

You can use any PostgreSQL client tool with these connection details:

**Popular Tools:**
- **pgAdmin** (Free, official PostgreSQL tool)
- **DBeaver** (Free, cross-platform)
- **TablePlus** (Paid, macOS/Windows)
- **DataGrip** (Paid, JetBrains)

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `agileflow_db` (or from your `DATABASE_URL`)
- Username/Password: From your `DATABASE_URL` environment variable

### 4. Viewing Connection String

Your database connection string is stored in the `.env` file as `DATABASE_URL`. The format is:

```
DATABASE_URL="postgresql://username:password@localhost:5432/agileflow_db?schema=public"
```

### 5. Running Migrations

To see the current database schema and run migrations:

```bash
# View migration status
npx prisma migrate status

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy
```

### 6. Generating Prisma Client

After schema changes:

```bash
npx prisma generate
```

## Important Tables

- **tenants**: Organization/tenant data
- **users**: User accounts
- **projects**: Main project management
- **tasks**: Task management
- **crm_clients**: CRM client data
- **crm_projects**: CRM-specific projects
- **crm_deals**: CRM deals
- **notes**: Project notes
- **notifications**: User notifications

## Security Note

⚠️ **Never commit your `.env` file** - it contains sensitive database credentials.

