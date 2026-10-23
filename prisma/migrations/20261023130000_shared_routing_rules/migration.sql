-- AlterTable
ALTER TABLE "endpoints" ADD COLUMN     "ruleId" TEXT;

-- CreateTable
CREATE TABLE "routing_rules" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matchMode" "RuleMatchMode" NOT NULL DEFAULT 'ALL',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routing_rules_appId_idx" ON "routing_rules"("appId");

-- CreateIndex
CREATE INDEX "endpoints_ruleId_idx" ON "endpoints"("ruleId");

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "routing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Converte os filtros que já estavam salvos nos destinos: cada um vira uma regra própria ligada ao destino.
CREATE TEMP TABLE "_endpoint_rule" AS
SELECT "id" AS "endpointId", gen_random_uuid()::text AS "ruleId", "appId", "url", "matchMode", "conditions"
FROM "endpoints"
WHERE "conditions" <> '[]'::jsonb;

INSERT INTO "routing_rules" ("id", "appId", "name", "matchMode", "conditions", "updatedAt")
SELECT "ruleId", "appId", 'Filtro de ' || "url", "matchMode", "conditions", CURRENT_TIMESTAMP
FROM "_endpoint_rule";

UPDATE "endpoints" SET "ruleId" = "_endpoint_rule"."ruleId"
FROM "_endpoint_rule"
WHERE "endpoints"."id" = "_endpoint_rule"."endpointId";

DROP TABLE "_endpoint_rule";

-- AlterTable
ALTER TABLE "endpoints" DROP COLUMN "conditions",
DROP COLUMN "matchMode";
