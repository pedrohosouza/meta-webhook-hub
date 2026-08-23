-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_logs" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventPayload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "executionTimeMs" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apps_verifyToken_key" ON "apps"("verifyToken");

-- CreateIndex
CREATE INDEX "endpoints_appId_idx" ON "endpoints"("appId");

-- CreateIndex
CREATE INDEX "delivery_logs_appId_createdAt_idx" ON "delivery_logs"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_logs_endpointId_idx" ON "delivery_logs"("endpointId");

-- CreateIndex
CREATE INDEX "delivery_logs_statusCode_createdAt_idx" ON "delivery_logs"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_logs_createdAt_idx" ON "delivery_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
