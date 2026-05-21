-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'TASK_DEADLINE', 'ISSUE_DUE', 'REMINDER', 'NOTE_DATE', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarEventSourceType" AS ENUM ('TASK', 'ISSUE', 'NOTE');

-- CreateEnum
CREATE TYPE "ExternalCalendarSource" AS ENUM ('NONE', 'GOOGLE', 'OUTLOOK');

-- CreateEnum
CREATE TYPE "CalendarSyncDirection" AS ENUM ('APP_TO_EXTERNAL', 'EXTERNAL_TO_APP', 'BIDIRECTIONAL');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "sectionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" "CalendarEventType" NOT NULL DEFAULT 'OTHER',
    "sourceType" "CalendarEventSourceType",
    "sourceId" TEXT,
    "createdById" TEXT NOT NULL,
    "reminderMinutesBefore" INTEGER,
    "externalSource" "ExternalCalendarSource" NOT NULL DEFAULT 'NONE',
    "externalCalendarId" TEXT,
    "externalEventId" TEXT,
    "syncDirection" "CalendarSyncDirection" NOT NULL DEFAULT 'APP_TO_EXTERNAL',
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "externalUserId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_tenantId_idx" ON "calendar_events"("tenantId");

-- CreateIndex
CREATE INDEX "calendar_events_projectId_idx" ON "calendar_events"("projectId");

-- CreateIndex
CREATE INDEX "calendar_events_sectionId_idx" ON "calendar_events"("sectionId");

-- CreateIndex
CREATE INDEX "calendar_events_startAt_idx" ON "calendar_events"("startAt");

-- CreateIndex
CREATE INDEX "calendar_events_endAt_idx" ON "calendar_events"("endAt");

-- CreateIndex
CREATE INDEX "calendar_events_sourceType_sourceId_idx" ON "calendar_events"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "calendar_events_createdById_idx" ON "calendar_events"("createdById");

-- CreateIndex
CREATE INDEX "calendar_events_externalSource_externalEventId_idx" ON "calendar_events"("externalSource", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "user_integrations_tenantId_userId_provider_key" ON "user_integrations"("tenantId", "userId", "provider");

-- CreateIndex
CREATE INDEX "user_integrations_tenantId_userId_idx" ON "user_integrations"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "user_integrations_provider_idx" ON "user_integrations"("provider");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

