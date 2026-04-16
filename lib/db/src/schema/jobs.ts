import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";
import { leadsTable } from "./leads";
import { quotesTable } from "./quotes";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  leadId: integer("lead_id").references(() => leadsTable.id),
  quoteId: integer("quote_id").references(() => quotesTable.id),
  title: text("title").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  address: text("address").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("scheduled"),
  priority: text("priority").notNull().default("medium"),
  assignedUserId: integer("assigned_user_id").references(() => usersTable.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completionPhotoUrl: text("completion_photo_url"),
  completionSignatureUrl: text("completion_signature_url"),
  completionNotes: text("completion_notes"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  totalAmount: real("total_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
