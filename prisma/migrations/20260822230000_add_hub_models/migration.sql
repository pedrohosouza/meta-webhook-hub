ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;
ALTER TABLE "users" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
DROP SEQUENCE IF EXISTS "users_id_seq";

CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_logs" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventPayload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "executionTimeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apps_verifyToken_key" ON "apps"("verifyToken");
CREATE INDEX "endpoints_appId_idx" ON "endpoints"("appId");
CREATE INDEX "delivery_logs_appId_createdAt_idx" ON "delivery_logs"("appId", "createdAt");
CREATE INDEX "delivery_logs_endpointId_idx" ON "delivery_logs"("endpointId");
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
