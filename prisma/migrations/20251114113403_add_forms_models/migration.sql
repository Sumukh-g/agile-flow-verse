-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submittedBy" TEXT,
    "data" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_shares" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "access" TEXT NOT NULL DEFAULT 'view',
    "shareLink" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forms_tenantId_idx" ON "forms"("tenantId");

-- CreateIndex
CREATE INDEX "forms_projectId_idx" ON "forms"("projectId");

-- CreateIndex
CREATE INDEX "forms_status_idx" ON "forms"("status");

-- CreateIndex
CREATE INDEX "forms_createdBy_idx" ON "forms"("createdBy");

-- CreateIndex
CREATE INDEX "form_responses_tenantId_idx" ON "form_responses"("tenantId");

-- CreateIndex
CREATE INDEX "form_responses_formId_idx" ON "form_responses"("formId");

-- CreateIndex
CREATE INDEX "form_responses_submittedBy_idx" ON "form_responses"("submittedBy");

-- CreateIndex
CREATE INDEX "form_responses_submittedAt_idx" ON "form_responses"("submittedAt");

-- CreateIndex
CREATE INDEX "form_shares_tenantId_idx" ON "form_shares"("tenantId");

-- CreateIndex
CREATE INDEX "form_shares_formId_idx" ON "form_shares"("formId");

-- CreateIndex
CREATE INDEX "form_shares_userId_idx" ON "form_shares"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "form_shares_shareLink_key" ON "form_shares"("shareLink");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_shares" ADD CONSTRAINT "form_shares_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_shares" ADD CONSTRAINT "form_shares_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_shares" ADD CONSTRAINT "form_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
