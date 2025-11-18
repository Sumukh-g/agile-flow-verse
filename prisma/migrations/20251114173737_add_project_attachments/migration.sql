-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "noteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
