/*
  Warnings:

  - The values [CREATING,PROCESSING,READY,FAILED] on the enum `WorkspaceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('INGEST');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."WorkspaceStatus_new" AS ENUM ('ACTIVE', 'DISABLED');
ALTER TABLE "public"."Workspace" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Workspace" ALTER COLUMN "status" TYPE "public"."WorkspaceStatus_new" USING ("status"::text::"public"."WorkspaceStatus_new");
ALTER TYPE "public"."WorkspaceStatus" RENAME TO "WorkspaceStatus_old";
ALTER TYPE "public"."WorkspaceStatus_new" RENAME TO "WorkspaceStatus";
DROP TYPE "public"."WorkspaceStatus_old";
ALTER TABLE "public"."Workspace" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Workspace" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "public"."DataSource" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "type" "public"."JobType" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."DataSource" ADD CONSTRAINT "DataSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
