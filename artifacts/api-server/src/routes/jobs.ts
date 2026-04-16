import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, jobsTable } from "@workspace/db";
import {
  CreateJobBody,
  UpdateJobBody,
  GetJobParams,
  UpdateJobParams,
  DeleteJobParams,
  ListJobsParams,
  CreateJobParams,
  CompleteJobParams,
  CompleteJobBody,
  AssignJobParams,
  AssignJobBody,
  ListJobsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/jobs", async (req, res): Promise<void> => {
  const params = ListJobsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = ListJobsQueryParams.safeParse(req.query);
  const conditions = [eq(jobsTable.tenantId, params.data.tenantId)];
  if (query.success) {
    if (query.data.status) conditions.push(eq(jobsTable.status, query.data.status));
    if (query.data.assignedUserId) conditions.push(eq(jobsTable.assignedUserId, query.data.assignedUserId));
  }
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(and(...conditions))
    .orderBy(jobsTable.createdAt);
  res.json(jobs);
});

router.post("/tenants/:tenantId/jobs", async (req, res): Promise<void> => {
  const params = CreateJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .insert(jobsTable)
    .values({
      tenantId: params.data.tenantId,
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    })
    .returning();
  res.status(201).json(job);
});

router.get("/tenants/:tenantId/jobs/:jobId", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

router.patch("/tenants/:tenantId/jobs/:jobId", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    })
    .where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

router.delete("/tenants/:tenantId/jobs/:jobId", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [job] = await db
    .delete(jobsTable)
    .where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/tenants/:tenantId/jobs/:jobId/complete", async (req, res): Promise<void> => {
  const params = CompleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CompleteJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      completionPhotoUrl: parsed.data.completionPhotoUrl ?? null,
      completionSignatureUrl: parsed.data.completionSignatureUrl ?? null,
      completionNotes: parsed.data.completionNotes ?? null,
    })
    .where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

router.patch("/tenants/:tenantId/jobs/:jobId/assign", async (req, res): Promise<void> => {
  const params = AssignJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AssignJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db
    .update(jobsTable)
    .set({ assignedUserId: parsed.data.assignedUserId })
    .where(and(eq(jobsTable.id, params.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

export default router;
