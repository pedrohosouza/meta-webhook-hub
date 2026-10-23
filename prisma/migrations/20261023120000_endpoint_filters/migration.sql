-- CreateEnum
CREATE TYPE "RuleMatchMode" AS ENUM ('ALL', 'ANY');

-- AlterTable
ALTER TABLE "endpoints" ADD COLUMN     "conditions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "matchMode" "RuleMatchMode" NOT NULL DEFAULT 'ALL';

