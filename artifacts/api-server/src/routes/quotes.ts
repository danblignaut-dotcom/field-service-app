import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, quotesTable } from "@workspace/db";
import {
  CreateQuoteBody,
  UpdateQuoteBody,
  GetQuoteParams,
  UpdateQuoteParams,
  DeleteQuoteParams,
  ListQuotesParams,
  CreateQuoteParams,
  ApproveQuoteParams,
  ListQuotesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calcTotals(lineItems: Array<{ quantity: number; unitPrice: number; description: string; total: number }>, taxRate: number) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

router.get("/tenants/:tenantId/quotes", async (req, res): Promise<void> => {
  const params = ListQuotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = ListQuotesQueryParams.safeParse(req.query);
  const conditions = [eq(quotesTable.tenantId, params.data.tenantId)];
  if (query.success && query.data.status) {
    conditions.push(eq(quotesTable.status, query.data.status));
  }
  const quotes = await db
    .select()
    .from(quotesTable)
    .where(and(...conditions))
    .orderBy(quotesTable.createdAt);
  res.json(quotes);
});

router.post("/tenants/:tenantId/quotes", async (req, res): Promise<void> => {
  const params = CreateQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const lineItems = (parsed.data.lineItems ?? []) as Array<{ quantity: number; unitPrice: number; description: string; total: number }>;
  const { subtotal, taxAmount, total } = calcTotals(lineItems, parsed.data.taxRate ?? 0);
  const lineItemsWithTotal = lineItems.map(li => ({
    ...li,
    total: li.quantity * li.unitPrice,
  }));
  const [quote] = await db
    .insert(quotesTable)
    .values({
      tenantId: params.data.tenantId,
      leadId: parsed.data.leadId ?? null,
      jobId: parsed.data.jobId ?? null,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail ?? null,
      customerPhone: parsed.data.customerPhone ?? null,
      address: parsed.data.address ?? null,
      lineItems: lineItemsWithTotal,
      subtotal,
      taxRate: parsed.data.taxRate ?? 0,
      taxAmount,
      total,
      status: "draft",
      notes: parsed.data.notes ?? null,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
    })
    .returning();
  res.status(201).json(quote);
});

router.get("/tenants/:tenantId/quotes/:quoteId", async (req, res): Promise<void> => {
  const params = GetQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(and(eq(quotesTable.id, params.data.quoteId), eq(quotesTable.tenantId, params.data.tenantId)));
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }
  res.json(quote);
});

router.patch("/tenants/:tenantId/quotes/:quoteId", async (req, res): Promise<void> => {
  const params = UpdateQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.lineItems || parsed.data.taxRate != null) {
    const lineItems = (parsed.data.lineItems ?? []) as Array<{ quantity: number; unitPrice: number; description: string; total: number }>;
    const taxRate = parsed.data.taxRate ?? 0;
    const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate);
    const lineItemsWithTotal = lineItems.map(li => ({
      ...li,
      total: li.quantity * li.unitPrice,
    }));
    updateData.lineItems = lineItemsWithTotal;
    updateData.subtotal = subtotal;
    updateData.taxAmount = taxAmount;
    updateData.total = total;
  }
  const [quote] = await db
    .update(quotesTable)
    .set(updateData)
    .where(and(eq(quotesTable.id, params.data.quoteId), eq(quotesTable.tenantId, params.data.tenantId)))
    .returning();
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }
  res.json(quote);
});

router.delete("/tenants/:tenantId/quotes/:quoteId", async (req, res): Promise<void> => {
  const params = DeleteQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quote] = await db
    .delete(quotesTable)
    .where(and(eq(quotesTable.id, params.data.quoteId), eq(quotesTable.tenantId, params.data.tenantId)))
    .returning();
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/tenants/:tenantId/quotes/:quoteId/approve", async (req, res): Promise<void> => {
  const params = ApproveQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quote] = await db
    .update(quotesTable)
    .set({ status: "approved" })
    .where(and(eq(quotesTable.id, params.data.quoteId), eq(quotesTable.tenantId, params.data.tenantId)))
    .returning();
  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }
  res.json(quote);
});

export default router;
