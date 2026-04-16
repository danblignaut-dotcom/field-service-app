import { Router, type IRouter } from "express";
import { eq, and, count, sum } from "drizzle-orm";
import { db, leadsTable, jobsTable, quotesTable } from "@workspace/db";
import { GetDashboardSummaryParams, GetRecentActivityParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/dashboard", async (req, res): Promise<void> => {
  const params = GetDashboardSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tenantId = params.data.tenantId;

  const [leadsResult] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(eq(leadsTable.tenantId, tenantId));

  const [openLeadsResult] = await db
    .select({ total: count() })
    .from(leadsTable)
    .where(and(eq(leadsTable.tenantId, tenantId), eq(leadsTable.status, "new")));

  const [jobsResult] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(eq(jobsTable.tenantId, tenantId));

  const [activeJobsResult] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.tenantId, tenantId), eq(jobsTable.status, "in_progress")));

  const [completedJobsResult] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(and(eq(jobsTable.tenantId, tenantId), eq(jobsTable.status, "completed")));

  const [revenueResult] = await db
    .select({ total: sum(jobsTable.totalAmount) })
    .from(jobsTable)
    .where(and(eq(jobsTable.tenantId, tenantId), eq(jobsTable.paymentStatus, "paid")));

  const [pendingRevenueResult] = await db
    .select({ total: sum(jobsTable.totalAmount) })
    .from(jobsTable)
    .where(and(eq(jobsTable.tenantId, tenantId), eq(jobsTable.paymentStatus, "unpaid")));

  const [quotesResult] = await db
    .select({ total: count() })
    .from(quotesTable)
    .where(eq(quotesTable.tenantId, tenantId));

  const [pendingQuotesResult] = await db
    .select({ total: count() })
    .from(quotesTable)
    .where(and(eq(quotesTable.tenantId, tenantId), eq(quotesTable.status, "sent")));

  const totalLeads = leadsResult?.total ?? 0;
  const convertedLeads = completedJobsResult?.total ?? 0;
  const conversionRate = totalLeads > 0 ? (Number(convertedLeads) / Number(totalLeads)) * 100 : 0;

  res.json({
    totalLeads: Number(leadsResult?.total ?? 0),
    openLeads: Number(openLeadsResult?.total ?? 0),
    totalJobs: Number(jobsResult?.total ?? 0),
    activeJobs: Number(activeJobsResult?.total ?? 0),
    completedJobs: Number(completedJobsResult?.total ?? 0),
    totalRevenue: Number(revenueResult?.total ?? 0),
    pendingRevenue: Number(pendingRevenueResult?.total ?? 0),
    totalQuotes: Number(quotesResult?.total ?? 0),
    pendingQuotes: Number(pendingQuotesResult?.total ?? 0),
    conversionRate: Math.round(conversionRate * 10) / 10,
  });
});

router.get("/tenants/:tenantId/activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tenantId = params.data.tenantId;

  const recentLeads = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.tenantId, tenantId))
    .orderBy(leadsTable.createdAt)
    .limit(5);

  const recentJobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.tenantId, tenantId))
    .orderBy(jobsTable.updatedAt)
    .limit(5);

  const activities = [
    ...recentLeads.map(l => ({
      id: `lead-${l.id}`,
      type: "lead_created",
      description: `New lead from ${l.customerName} for ${l.serviceType}`,
      entityId: l.id,
      entityType: "lead",
      createdAt: l.createdAt.toISOString(),
    })),
    ...recentJobs.map(j => ({
      id: `job-${j.id}`,
      type: j.status === "completed" ? "job_completed" : "job_updated",
      description: `Job "${j.title}" ${j.status === "completed" ? "completed" : "updated to " + j.status}`,
      entityId: j.id,
      entityType: "job",
      createdAt: j.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json(activities);
});

export default router;
