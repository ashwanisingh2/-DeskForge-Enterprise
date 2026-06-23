CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "deviceInfo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_revokedAt_createdAt_idx" ON "RefreshToken"("userId", "revokedAt", "createdAt");
CREATE INDEX "RefreshToken_tenantId_expiresAt_idx" ON "RefreshToken"("tenantId", "expiresAt");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION tenant_matches(tenant_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN tenant_id = current_tenant_id();
END;
$$ LANGUAGE plpgsql STABLE;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KBArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SLAConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CannedResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChangeRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Problem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceCatalogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RelatedTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CIRelationship" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Approval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProblemIncident" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_user ON "User" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_ticket ON "Ticket" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_kb ON "KBArticle" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_notification ON "Notification" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_audit ON "AuditLog" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_sla ON "SLAConfig" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_canned ON "CannedResponse" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_asset ON "Asset" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_change ON "ChangeRequest" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_problem ON "Problem" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_catalog ON "ServiceCatalogItem" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_time ON "TimeEntry" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));
CREATE POLICY tenant_login ON "LoginEvent" USING ("tenantId" IS NULL OR tenant_matches("tenantId")) WITH CHECK ("tenantId" IS NULL OR tenant_matches("tenantId"));
CREATE POLICY tenant_refresh ON "RefreshToken" USING (tenant_matches("tenantId")) WITH CHECK (tenant_matches("tenantId"));

CREATE POLICY tenant_comment ON "Comment" USING (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "Comment"."ticketId" AND tenant_matches(t."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "Comment"."ticketId" AND tenant_matches(t."tenantId")));
CREATE POLICY tenant_activity ON "ActivityLog" USING (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "ActivityLog"."ticketId" AND tenant_matches(t."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "ActivityLog"."ticketId" AND tenant_matches(t."tenantId")));
CREATE POLICY tenant_attachment ON "Attachment" USING (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "Attachment"."ticketId" AND tenant_matches(t."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "Attachment"."ticketId" AND tenant_matches(t."tenantId")));
CREATE POLICY tenant_related_ticket ON "RelatedTicket" USING (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "RelatedTicket"."ticketAId" AND tenant_matches(t."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Ticket" t WHERE t."id" = "RelatedTicket"."ticketAId" AND tenant_matches(t."tenantId")));
CREATE POLICY tenant_ci_relationship ON "CIRelationship" USING (EXISTS (SELECT 1 FROM "Asset" a WHERE a."id" = "CIRelationship"."sourceId" AND tenant_matches(a."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Asset" a WHERE a."id" = "CIRelationship"."sourceId" AND tenant_matches(a."tenantId")));
CREATE POLICY tenant_approval ON "Approval" USING (EXISTS (SELECT 1 FROM "ChangeRequest" c WHERE c."id" = "Approval"."changeId" AND tenant_matches(c."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "ChangeRequest" c WHERE c."id" = "Approval"."changeId" AND tenant_matches(c."tenantId")));
CREATE POLICY tenant_problem_incident ON "ProblemIncident" USING (EXISTS (SELECT 1 FROM "Problem" p WHERE p."id" = "ProblemIncident"."problemId" AND tenant_matches(p."tenantId"))) WITH CHECK (EXISTS (SELECT 1 FROM "Problem" p WHERE p."id" = "ProblemIncident"."problemId" AND tenant_matches(p."tenantId")));
