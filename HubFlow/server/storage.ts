import {
  users, departments, employees, workflowTemplates, templateSteps,
  workflows, workflowSteps, tasks, auditLogs, notifications,
  type User, type InsertUser,
  type Department, type InsertDepartment,
  type Employee, type InsertEmployee,
  type WorkflowTemplate, type InsertWorkflowTemplate,
  type TemplateStep, type InsertTemplateStep,
  type Workflow, type InsertWorkflow,
  type WorkflowStep, type InsertWorkflowStep,
  type Task, type InsertTask,
  type AuditLog, type InsertAuditLog,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Departments
  getDepartment(id: string): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<boolean>;

  // Employees
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(filters?: { status?: string; departmentId?: string }): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  searchEmployees(query: string): Promise<Employee[]>;

  // Workflow Templates
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  getWorkflowTemplates(filters?: { type?: string; status?: string }): Promise<WorkflowTemplate[]>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
  updateWorkflowTemplate(id: string, template: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined>;
  deleteWorkflowTemplate(id: string): Promise<boolean>;

  // Template Steps
  getTemplateStep(id: string): Promise<TemplateStep | undefined>;
  getTemplateSteps(templateId: string): Promise<TemplateStep[]>;
  createTemplateStep(step: InsertTemplateStep): Promise<TemplateStep>;
  updateTemplateStep(id: string, step: Partial<InsertTemplateStep>): Promise<TemplateStep | undefined>;
  deleteTemplateStep(id: string): Promise<boolean>;
  deleteTemplateStepsByTemplateId(templateId: string): Promise<boolean>;

  // Workflows
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflows(filters?: { status?: string; type?: string; employeeId?: string; assignedTo?: string }): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Workflow Steps
  getWorkflowStep(id: string): Promise<WorkflowStep | undefined>;
  getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: string, step: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined>;
  deleteWorkflowStep(id: string): Promise<boolean>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasks(filters?: { workflowId?: string; assigneeId?: string; status?: string }): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getPendingTasks(userId?: string): Promise<Task[]>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string }): Promise<AuditLog[]>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<boolean>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeWorkflows: number;
    pendingTasks: number;
    completedThisWeek: number;
    joiningCount: number;
    movingCount: number;
    leavingCount: number;
  }>;

  // Reporting
  getWorkflowMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalWorkflows: number;
    completedWorkflows: number;
    avgCompletionDays: number;
    byType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Departments
  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async updateDepartment(id: string, departmentData: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db.update(departments)
      .set({ ...departmentData, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    await db.delete(departments).where(eq(departments.id, id));
    return true;
  }

  // Employees
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployees(filters?: { status?: string; departmentId?: string }): Promise<Employee[]> {
    let query = db.select().from(employees);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(employees.status, filters.status as any));
    }
    if (filters?.departmentId) {
      conditions.push(eq(employees.departmentId, filters.departmentId));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(employees.createdAt));
    }
    return await query.orderBy(desc(employees.createdAt));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await db.delete(employees).where(eq(employees.id, id));
    return true;
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(employees)
      .where(
        or(
          ilike(employees.firstName, searchPattern),
          ilike(employees.lastName, searchPattern),
          ilike(employees.email, searchPattern),
          ilike(employees.jobTitle, searchPattern)
        )
      )
      .orderBy(employees.firstName);
  }

  // Workflow Templates
  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
    return template || undefined;
  }

  async getWorkflowTemplates(filters?: { type?: string; status?: string }): Promise<WorkflowTemplate[]> {
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(workflowTemplates.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(workflowTemplates.status, filters.status as any));
    }

    if (conditions.length > 0) {
      return await db.select().from(workflowTemplates)
        .where(and(...conditions))
        .orderBy(desc(workflowTemplates.createdAt));
    }
    return await db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.createdAt));
  }

  async createWorkflowTemplate(insertTemplate: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const [template] = await db.insert(workflowTemplates).values(insertTemplate).returning();
    return template;
  }

  async updateWorkflowTemplate(id: string, templateData: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate | undefined> {
    const [template] = await db.update(workflowTemplates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(workflowTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteWorkflowTemplate(id: string): Promise<boolean> {
    await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
    return true;
  }

  // Template Steps
  async getTemplateStep(id: string): Promise<TemplateStep | undefined> {
    const [step] = await db.select().from(templateSteps).where(eq(templateSteps.id, id));
    return step || undefined;
  }

  async getTemplateSteps(templateId: string): Promise<TemplateStep[]> {
    return await db.select().from(templateSteps)
      .where(eq(templateSteps.templateId, templateId))
      .orderBy(templateSteps.stepOrder);
  }

  async createTemplateStep(insertStep: InsertTemplateStep): Promise<TemplateStep> {
    const [step] = await db.insert(templateSteps).values(insertStep).returning();
    return step;
  }

  async updateTemplateStep(id: string, stepData: Partial<InsertTemplateStep>): Promise<TemplateStep | undefined> {
    const [step] = await db.update(templateSteps)
      .set(stepData)
      .where(eq(templateSteps.id, id))
      .returning();
    return step || undefined;
  }

  async deleteTemplateStep(id: string): Promise<boolean> {
    await db.delete(templateSteps).where(eq(templateSteps.id, id));
    return true;
  }

  async deleteTemplateStepsByTemplateId(templateId: string): Promise<boolean> {
    await db.delete(templateSteps).where(eq(templateSteps.templateId, templateId));
    return true;
  }

  // Workflows
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow || undefined;
  }

  async getWorkflows(filters?: { status?: string; type?: string; employeeId?: string; assignedTo?: string }): Promise<Workflow[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(workflows.status, filters.status as any));
    }
    if (filters?.type) {
      conditions.push(eq(workflows.type, filters.type as any));
    }
    if (filters?.employeeId) {
      conditions.push(eq(workflows.employeeId, filters.employeeId));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(workflows.assignedTo, filters.assignedTo));
    }

    if (conditions.length > 0) {
      return await db.select().from(workflows)
        .where(and(...conditions))
        .orderBy(desc(workflows.createdAt));
    }
    return await db.select().from(workflows).orderBy(desc(workflows.createdAt));
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(insertWorkflow).returning();
    return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [workflow] = await db.update(workflows)
      .set({ ...workflowData, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return workflow || undefined;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    await db.delete(workflows).where(eq(workflows.id, id));
    return true;
  }

  // Workflow Steps
  async getWorkflowStep(id: string): Promise<WorkflowStep | undefined> {
    const [step] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, id));
    return step || undefined;
  }

  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await db.select().from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.stepOrder);
  }

  async createWorkflowStep(insertStep: InsertWorkflowStep): Promise<WorkflowStep> {
    const [step] = await db.insert(workflowSteps).values(insertStep).returning();
    return step;
  }

  async updateWorkflowStep(id: string, stepData: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined> {
    const [step] = await db.update(workflowSteps)
      .set({ ...stepData, updatedAt: new Date() })
      .where(eq(workflowSteps.id, id))
      .returning();
    return step || undefined;
  }

  async deleteWorkflowStep(id: string): Promise<boolean> {
    await db.delete(workflowSteps).where(eq(workflowSteps.id, id));
    return true;
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasks(filters?: { workflowId?: string; assigneeId?: string; status?: string }): Promise<Task[]> {
    const conditions = [];
    if (filters?.workflowId) {
      conditions.push(eq(tasks.workflowId, filters.workflowId));
    }
    if (filters?.assigneeId) {
      conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }

    if (conditions.length > 0) {
      return await db.select().from(tasks)
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));
    }
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  async getPendingTasks(userId?: string): Promise<Task[]> {
    const conditions = [
      or(
        eq(tasks.status, 'pending'),
        eq(tasks.status, 'in_progress')
      )
    ];
    
    if (userId) {
      conditions.push(eq(tasks.assigneeId, userId));
    }

    return await db.select().from(tasks)
      .where(and(...conditions as any))
      .orderBy(tasks.dueDate);
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getAuditLogs(filters?: { entityType?: string; entityId?: string; userId?: string }): Promise<AuditLog[]> {
    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    if (conditions.length > 0) {
      return await db.select().from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
    }
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return true;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    activeWorkflows: number;
    pendingTasks: number;
    completedThisWeek: number;
    joiningCount: number;
    movingCount: number;
    leavingCount: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [activeWorkflowsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(workflows)
      .where(inArray(workflows.status, ['pending', 'in_progress']));

    const [pendingTasksResult] = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(inArray(tasks.status, ['pending', 'in_progress']));

    const [completedThisWeekResult] = await db.select({ count: sql<number>`count(*)` })
      .from(workflows)
      .where(and(
        eq(workflows.status, 'completed'),
        sql`${workflows.completedAt} >= ${oneWeekAgo}`
      ));

    const [joiningResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.status, 'joining'));

    const [movingResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.status, 'moving'));

    const [leavingResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.status, 'leaving'));

    return {
      activeWorkflows: Number(activeWorkflowsResult?.count || 0),
      pendingTasks: Number(pendingTasksResult?.count || 0),
      completedThisWeek: Number(completedThisWeekResult?.count || 0),
      joiningCount: Number(joiningResult?.count || 0),
      movingCount: Number(movingResult?.count || 0),
      leavingCount: Number(leavingResult?.count || 0),
    };
  }

  // Reporting
  async getWorkflowMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalWorkflows: number;
    completedWorkflows: number;
    avgCompletionDays: number;
    byType: { type: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }> {
    const conditions = [];
    if (startDate) {
      conditions.push(sql`${workflows.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${workflows.createdAt} <= ${endDate}`);
    }

    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(workflows)
      .where(baseWhere);

    const [completedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(workflows)
      .where(baseWhere ? and(baseWhere, eq(workflows.status, 'completed')) : eq(workflows.status, 'completed'));

    const byTypeResult = await db.select({
      type: workflows.type,
      count: sql<number>`count(*)`
    })
      .from(workflows)
      .where(baseWhere)
      .groupBy(workflows.type);

    const byStatusResult = await db.select({
      status: workflows.status,
      count: sql<number>`count(*)`
    })
      .from(workflows)
      .where(baseWhere)
      .groupBy(workflows.status);

    return {
      totalWorkflows: Number(totalResult?.count || 0),
      completedWorkflows: Number(completedResult?.count || 0),
      avgCompletionDays: 5, // Placeholder - would need date math
      byType: byTypeResult.map(r => ({ type: r.type, count: Number(r.count) })),
      byStatus: byStatusResult.map(r => ({ status: r.status, count: Number(r.count) })),
    };
  }
}

export const storage = new DatabaseStorage();
