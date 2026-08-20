-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LifeCategory" AS ENUM ('FINANCE', 'CAREER', 'SOCIAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('OFFICIAL', 'BILIBILI', 'DOUYIN', 'XIAOHONGSHU', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'STALE');

-- CreateEnum
CREATE TYPE "FinanceKind" AS ENUM ('BANK_CARD', 'PAYMENT_ACCOUNT', 'LOAN', 'CREDIT');

-- CreateEnum
CREATE TYPE "CareerKind" AS ENUM ('GOAL', 'RESUME', 'SIDE_PROJECT');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('IN_APP', 'WECHAT');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "wechat_open_id" TEXT,
    "display_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" "LifeCategory" NOT NULL,
    "disclaimer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_contents" (
    "id" UUID NOT NULL,
    "platform" "ContentPlatform" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interaction_count" INTEGER,
    "tags" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sources" (
    "question_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "question_sources_pkey" PRIMARY KEY ("question_id","content_id")
);

-- CreateTable
CREATE TABLE "finance_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "FinanceKind" NOT NULL,
    "institution" TEXT NOT NULL,
    "alias" TEXT,
    "last_four" VARCHAR(4),
    "billing_day" INTEGER,
    "repayment_day" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "CareerKind" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'PLANNED',
    "target_date" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_files" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "class_name" TEXT,
    "encrypted_phone" TEXT,
    "birthday" VARCHAR(5),
    "photo_key" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "request_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wechat_open_id_key" ON "users"("wechat_open_id");

-- CreateIndex
CREATE INDEX "questions_user_id_created_at_idx" ON "questions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_contents_url_key" ON "external_contents"("url");

-- CreateIndex
CREATE INDEX "external_contents_status_verified_at_idx" ON "external_contents"("status", "verified_at");

-- CreateIndex
CREATE INDEX "finance_items_user_id_kind_idx" ON "finance_items"("user_id", "kind");

-- CreateIndex
CREATE INDEX "career_items_user_id_kind_idx" ON "career_items"("user_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "resume_files_user_id_name_version_key" ON "resume_files"("user_id", "name", "version");

-- CreateIndex
CREATE INDEX "contacts_user_id_name_idx" ON "contacts"("user_id", "name");

-- CreateIndex
CREATE INDEX "reminders_user_id_status_remind_at_idx" ON "reminders"("user_id", "status", "remind_at");

-- CreateIndex
CREATE INDEX "content_reports_status_created_at_idx" ON "content_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "external_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_items" ADD CONSTRAINT "finance_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_items" ADD CONSTRAINT "career_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "external_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
