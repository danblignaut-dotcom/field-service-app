import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  ListUsersParams,
  CreateUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/:tenantId/users", async (req, res): Promise<void> => {
  const params = ListUsersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tenantId, params.data.tenantId))
    .orderBy(usersTable.name);
  res.json(users);
});

router.post("/tenants/:tenantId/users", async (req, res): Promise<void> => {
  const params = CreateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({ ...parsed.data, tenantId: params.data.tenantId })
    .returning();
  res.status(201).json(user);
});

router.get("/tenants/:tenantId/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, params.data.userId), eq(usersTable.tenantId, params.data.tenantId)));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/tenants/:tenantId/users/:userId", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(and(eq(usersTable.id, params.data.userId), eq(usersTable.tenantId, params.data.tenantId)))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.delete("/tenants/:tenantId/users/:userId", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db
    .delete(usersTable)
    .where(and(eq(usersTable.id, params.data.userId), eq(usersTable.tenantId, params.data.tenantId)))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
