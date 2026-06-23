ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'PENDING_CUSTOMER';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "SLAStatus" ADD VALUE IF NOT EXISTS 'WARNING';
ALTER TYPE "SLAStatus" ADD VALUE IF NOT EXISTS 'CRITICAL';

CREATE TABLE IF NOT EXISTS "BusinessHour" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startHour" INTEGER NOT NULL,
  "endHour" INTEGER NOT NULL,
  CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessHour_tenantId_dayOfWeek_key" ON "BusinessHour"("tenantId","dayOfWeek");
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Holiday" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_tenantId_date_key" ON "Holiday"("tenantId","date");
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SLAClockHistory" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SLAClockHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SLAClockHistory_ticketId_createdAt_idx" ON "SLAClockHistory"("ticketId","createdAt");
ALTER TABLE "SLAClockHistory" ADD CONSTRAINT "SLAClockHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessHour" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Holiday" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SLAClockHistory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_business_hour ON "BusinessHour" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_holiday ON "Holiday" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_sla_history ON "SLAClockHistory" USING (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "SLAClockHistory"."ticketId" AND tenant_matches(t."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "SLAClockHistory"."ticketId" AND tenant_matches(t."tenantId")));
