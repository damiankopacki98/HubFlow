import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for status tracking
export const userRoleEnum = pgEnum("user_role", ["admin", "hr_manager", "it_admin", "manager", "viewer"]);
export const employeeStatusEnum = pgEnum("employee_status", ["joining", "active", "moving", "leaving", "departed"]);
export const workflowTypeEnum = pgEnum("workflow_type", ["joiner", "mover", "leaver"]);
export const templateStatusEnum = pgEnum("template_status", ["draft", "active", "archived"]);
export const workflowStatusEnum = pgEnum("workflow_status", ["pending", "in_progress", "completed", "blocked", "cancelled"]);
export const stepStatusEnum = pgEnum("step_status", ["pending", "in_progress", "completed", "blocked", "skipped"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "blocked"]);

// Users table with role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  departmentId: varchar("department_id"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  managerId: varchar("manager_id"),
  parentDepartmentId: varchar("parent_department_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Employees table - people going through JML processes
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeNumber: text("employee_number").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  personalEmail: text("personal_email"),
  phone: text("phone"),
  jobTitle: text("job_title").notNull(),
  departmentId: varchar("department_id").notNull(),
  managerId: varchar("manager_id"),
  status: employeeStatusEnum("status").notNull().default("joining"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  workType: text("work_type").default("full-time"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow templates - reusable JML process blueprints
export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: workflowTypeEnum("type").notNull(),
  status: templateStatusEnum("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  isDefault: boolean("is_default").notNull().default(false),
  estimatedDays: integer("estimated_days"),
  metadata: jsonb("metadata"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Template steps - individual steps within a template
export const templateSteps = pgTable("template_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  stepOrder: integer("step_order").notNull(),
  assigneeRole: userRoleEnum("assignee_role"),
  assigneeId: varchar("assignee_id"),
  slaMinutes: integer("sla_minutes"),
  isRequired: boolean("is_required").notNull().default(true),
  automationConfig: jsonb("automation_config"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Active workflows - instances of templates being executed
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  name: text("name").notNull(),
  type: workflowTypeEnum("type").notNull(),
  status: workflowStatusEnum("status").notNull().default("pending"),
  initiatedBy: varchar("initiated_by").notNull(),
  assignedTo: varchar("assigned_to"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow steps - individual step instances within a workflow
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  templateStepId: varchar("template_step_id"),
  name: text("name").notNull(),
  description: text("description"),
  stepOrder: integer("step_order").notNull(),
  status: stepStatusEnum("status").notNull().default("pending"),
  assigneeId: varchar("assignee_id"),
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tasks - granular action items within workflow steps
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowStepId: varchar("workflow_step_id").notNull(),
  workflowId: varchar("workflow_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  assigneeId: varchar("assignee_id"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit logs for tracking all system activities
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  description: text("description"),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications for users
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas with Zod validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateStepSchema = createInsertSchema(templateSteps).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;

export type InsertTemplateStep = z.infer<typeof insertTemplateStepSchema>;
export type TemplateStep = typeof templateSteps.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Helper types for RBAC
export type UserRole = "admin" | "hr_manager" | "it_admin" | "manager" | "viewer";
export type EmployeeStatus = "joining" | "active" | "moving" | "leaving" | "departed";
export type WorkflowType = "joiner" | "mover" | "leaver";
export type TemplateStatus = "draft" | "active" | "archived";
export type WorkflowStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
export type StepStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";
