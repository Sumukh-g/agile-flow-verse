Agile Flow Verse Backend (NestJS 10, Prisma, Postgres RLS, Kafka Outbox)

Run locally:
- docker-compose up -d
- npm install
- npx prisma generate
- npx prisma migrate dev
- npm run api:dev

Headers:
- Authorization: Bearer <jwt>
- x-tenant-id: <tenant-id> (dev fallback) 