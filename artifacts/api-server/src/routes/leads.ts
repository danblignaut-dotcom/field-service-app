import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, leadsTable, jobsTable } from "@workspace/db";
import {
  CreateLeadBody,
  UpdateLeadBody,
  GetLeadParams,
  UpdateLeadParams,
  DeleteLeadParams,
  ListLeadsParams,
  CreateLeadParams,
  ConvertLeadToJobParams,
  ListLeadsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/leads", async (req, res): Promise<void> => {
  const params = ListLeadsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = ListLeadsQueryParams.safeParse(req.query);
  const conditions = [eq(leadsTable.tenantId, params.data.tenantId)];
  if (query.success && query.data.status) {
    conditions.push(eq(leadsTable.status, query.data.status));
  }
  const leads = await db
    .select()
    .from(leadsTable)
    .where(and(...conditions))
    .orderBy(leadsTable.createdAt);
  res.json(leads);
});

router.post("/tenants/:tenantId/leads", async (req, res): Promise<void> => {
  const params = CreateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db
    .insert(leadsTable)
    .values({ ...parsed.data, tenantId: params.data.tenantId })
    .returning();
  res.status(201).json(lead);
});

router.get("/tenants/:tenantId/leads/:leadId", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(and(eq(leadsTable.id, params.data.leadId), eq(leadsTable.tenantId, params.data.tenantId)));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

router.patch("/tenants/:tenantId/leads/:leadId", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db
    .update(leadsTable)
    .set(parsed.data)
    .where(and(eq(leadsTable.id, params.data.leadId), eq(leadsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

router.delete("/tenants/:tenantId/leads/:leadId", async (req, res): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db
    .delete(leadsTable)
    .where(and(eq(leadsTable.id, params.data.leadId), eq(leadsTable.tenantId, params.data.tenantId)))
    .returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/tenants/:tenantId/leads/:leadId/convert", async (req, res): Promise<void> => {
  const params = ConvertLeadToJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(and(eq(leadsTable.id, params.data.leadId), eq(leadsTable.tenantId, params.data.tenantId)));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [job] = await db
    .insert(jobsTable)
    .values({
      tenantId: lead.tenantId,
      leadId: lead.id,
      title: `${lead.serviceType} - ${lead.customerName}`,
      customerName: lead.customerName,
      customerEmail: lead.customerEmail,
      customerPhone: lead.customerPhone,
      address: lead.address ?? "",
      serviceType: lead.serviceType,
      description: lead.description,
      status: "scheduled",
      priority: lead.priority,
      assignedUserId: lead.assignedUserId,
      totalAmount: lead.estimatedValue,
    })
    .returning();
  await db
    .update(leadsTable)
    .set({ status: "converted" })
    .where(eq(leadsTable.id, lead.id));
  res.status(201).json(job);
});

export default router;
