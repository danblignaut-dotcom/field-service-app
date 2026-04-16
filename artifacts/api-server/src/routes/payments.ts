import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, jobsTable, tenantsTable } from "@workspace/db";
import {
  InitiatePaymentBody,
  InitiatePaymentParams,
  VerifyPaymentBody,
  VerifyPaymentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/tenants/:tenantId/payments/initiate", async (req, res): Promise<void> => {
  const params = InitiatePaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, params.data.tenantId));

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  const reference = `FSM-${Date.now()}-${parsed.data.jobId}`;
  const provider = tenant.paymentProvider;

  if (provider === "paystack") {
    res.json({
      provider: "paystack",
      checkoutUrl: `https://checkout.paystack.com/pay/${reference}`,
      reference,
      clientSecret: null,
    });
  } else {
    res.json({
      provider: "stripe",
      checkoutUrl: null,
      reference,
      clientSecret: `pi_demo_secret_${reference}`,
    });
  }
});

router.post("/tenants/:tenantId/payments/verify", async (req, res): Promise<void> => {
  const params = VerifyPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .update(jobsTable)
    .set({ paymentStatus: "paid" })
    .where(and(eq(jobsTable.id, parsed.data.jobId), eq(jobsTable.tenantId, params.data.tenantId)));

  res.json({
    success: true,
    status: "paid",
    jobId: parsed.data.jobId,
  });
});

export default router;
