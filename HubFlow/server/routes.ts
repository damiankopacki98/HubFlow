import type { Express, Request, Response } from "express";
import type { Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  insertUserSchema, insertDepartmentSchema, insertEmployeeSchema,
  insertWorkflowTemplateSchema, insertTemplateStepSchema,
  insertWorkflowSchema, insertWorkflowStepSchema, insertTaskSchema,
  insertNotificationSchema
} from "@shared/schema";

function omitPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password, ...rest } = user;
  return rest;
}

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

async function createAuditLog(userId: string | undefined, action: string, entityType: string, entityId?: string, description?: string) {
  await storage.createAuditLog({
    userId: userId || null,
    action,
    entityType,
    entityId: entityId || null,
    description: description || null,
    changes: null,
    ipAddress: null,
    userAgent: null,
  });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  // Users
  app.get("/api/users", asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(omitPassword));
  }));

  app.get("/api/users/:id", asyncHandler(async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(omitPassword(user));
  }));

  app.post("/api/users", asyncHandler(async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid user data", errors: parsed.error.errors });
      return;
    }
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    const user = await storage.createUser({ ...parsed.data, password: hashedPassword });
    await createAuditLog(undefined, "create", "user", user.id, `Created user ${user.email}`);
    res.status(201).json(omitPassword(user));
  }));

  app.patch("/api/users/:id", asyncHandler(async (req, res) => {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const user = await storage.updateUser(req.params.id, updateData);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    await createAuditLog(undefined, "update", "user", user.id, `Updated user ${user.email}`);
    res.json(omitPassword(user));
  }));

  app.delete("/api/users/:id", asyncHandler(async (req, res) => {
    await storage.deleteUser(req.params.id);
    await createAuditLog(undefined, "delete", "user", req.params.id, "Deleted user");
    res.status(204).send();
  }));

  // Departments
  app.get("/api/departments", asyncHandler(async (req, res) => {
    const departments = await storage.getDepartments();
    res.json(departments);
  }));

  app.get("/api/departments/:id", asyncHandler(async (req, res) => {
    const department = await storage.getDepartment(req.params.id);
    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    res.json(department);
  }));

  app.post("/api/departments", asyncHandler(async (req, res) => {
    const parsed = insertDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid department data", errors: parsed.error.errors });
      return;
    }
    const department = await storage.createDepartment(parsed.data);
    await createAuditLog(undefined, "create", "department", department.id, `Created department ${department.name}`);
    res.status(201).json(department);
  }));

  app.patch("/api/departments/:id", asyncHandler(async (req, res) => {
    const department = await storage.updateDepartment(req.params.id, req.body);
    if (!department) {
      res.status(404).json({ message: "Department not found" });
      return;
    }
    res.json(department);
  }));

  app.delete("/api/departments/:id", asyncHandler(async (req, res) => {
    await storage.deleteDepartment(req.params.id);
    res.status(204).send();
  }));

  // Employees
  app.get("/api/employees", asyncHandler(async (req, res) => {
    const { status, departmentId } = req.query;
    const employees = await storage.getEmployees({
      status: status as string,
      departmentId: departmentId as string,
    });
    res.json(employees);
  }));

  app.get("/api/employees/search", asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ message: "Search query required" });
      return;
    }
    const employees = await storage.searchEmployees(q);
    res.json(employees);
  }));

  app.get("/api/employees/:id", asyncHandler(async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }
    res.json(employee);
  }));

  app.post("/api/employees", asyncHandler(async (req, res) => {
    const parsed = insertEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid employee data", errors: parsed.error.errors });
      return;
    }
    const employee = await storage.createEmployee(parsed.data);
    await createAuditLog(undefined, "create", "employee", employee.id, `Created employee ${employee.firstName} ${employee.lastName}`);
    res.status(201).json(employee);
  }));

  app.patch("/api/employees/:id", asyncHandler(async (req, res) => {
    const employee = await storage.updateEmployee(req.params.id, req.body);
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }
    res.json(employee);
  }));

  app.delete("/api/employees/:id", asyncHandler(async (req, res) => {
    await storage.deleteEmployee(req.params.id);
    res.status(204).send();
  }));

  // Workflow Templates
  app.get("/api/templates", asyncHandler(async (req, res) => {
    const { type, status } = req.query;
    const templates = await storage.getWorkflowTemplates({
      type: type as string,
      status: status as string,
    });
    res.json(templates);
  }));

  app.get("/api/templates/:id", asyncHandler(async (req, res) => {
    const template = await storage.getWorkflowTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    const steps = await storage.getTemplateSteps(req.params.id);
    res.json({ ...template, steps });
  }));

  app.post("/api/templates", asyncHandler(async (req, res) => {
    const { steps, ...templateData } = req.body;
    const parsed = insertWorkflowTemplateSchema.safeParse(templateData);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid template data", errors: parsed.error.errors });
      return;
    }
    const template = await storage.createWorkflowTemplate(parsed.data);
    
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await storage.createTemplateStep({ ...step, templateId: template.id });
      }
    }
    
    await createAuditLog(undefined, "create", "template", template.id, `Created template ${template.name}`);
    res.status(201).json(template);
  }));

  app.patch("/api/templates/:id", asyncHandler(async (req, res) => {
    const { steps, ...templateData } = req.body;
    const template = await storage.updateWorkflowTemplate(req.params.id, templateData);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    
    if (steps && Array.isArray(steps)) {
      await storage.deleteTemplateStepsByTemplateId(req.params.id);
      for (const step of steps) {
        await storage.createTemplateStep({ ...step, templateId: req.params.id });
      }
    }
    
    res.json(template);
  }));

  app.delete("/api/templates/:id", asyncHandler(async (req, res) => {
    await storage.deleteTemplateStepsByTemplateId(req.params.id);
    await storage.deleteWorkflowTemplate(req.params.id);
    res.status(204).send();
  }));

  app.get("/api/templates/:id/steps", asyncHandler(async (req, res) => {
    const steps = await storage.getTemplateSteps(req.params.id);
    res.json(steps);
  }));

  app.post("/api/templates/:id/steps", asyncHandler(async (req, res) => {
    const parsed = insertTemplateStepSchema.safeParse({ ...req.body, templateId: req.params.id });
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid step data", errors: parsed.error.errors });
      return;
    }
    const step = await storage.createTemplateStep(parsed.data);
    res.status(201).json(step);
  }));

  // Workflows
  app.get("/api/workflows", asyncHandler(async (req, res) => {
    const { status, type, employeeId, assignedTo } = req.query;
    const workflows = await storage.getWorkflows({
      status: status as string,
      type: type as string,
      employeeId: employeeId as string,
      assignedTo: assignedTo as string,
    });
    res.json(workflows);
  }));

  app.get("/api/workflows/:id", asyncHandler(async (req, res) => {
    const workflow = await storage.getWorkflow(req.params.id);
    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }
    const steps = await storage.getWorkflowSteps(req.params.id);
    const employee = await storage.getEmployee(workflow.employeeId);
    res.json({ ...workflow, steps, employee });
  }));

  app.post("/api/workflows", asyncHandler(async (req, res) => {
    const parsed = insertWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid workflow data", errors: parsed.error.errors });
      return;
    }
    const workflow = await storage.createWorkflow(parsed.data);
    
    if (parsed.data.templateId) {
      const templateSteps = await storage.getTemplateSteps(parsed.data.templateId);
      for (const templateStep of templateSteps) {
        await storage.createWorkflowStep({
          workflowId: workflow.id,
          templateStepId: templateStep.id,
          name: templateStep.name,
          description: templateStep.description,
          stepOrder: templateStep.stepOrder,
          status: "pending",
          assigneeId: templateStep.assigneeId,
          dueDate: null,
          startedAt: null,
          completedAt: null,
          completedBy: null,
          notes: null,
          metadata: null,
        });
      }
    }
    
    await createAuditLog(undefined, "create", "workflow", workflow.id, `Created workflow ${workflow.name}`);
    res.status(201).json(workflow);
  }));

  app.patch("/api/workflows/:id", asyncHandler(async (req, res) => {
    const workflow = await storage.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      res.status(404).json({ message: "Workflow not found" });
      return;
    }
    res.json(workflow);
  }));

  app.delete("/api/workflows/:id", asyncHandler(async (req, res) => {
    await storage.deleteWorkflow(req.params.id);
    res.status(204).send();
  }));

  app.get("/api/workflows/:id/steps", asyncHandler(async (req, res) => {
    const steps = await storage.getWorkflowSteps(req.params.id);
    res.json(steps);
  }));

  app.patch("/api/workflow-steps/:id", asyncHandler(async (req, res) => {
    const step = await storage.updateWorkflowStep(req.params.id, req.body);
    if (!step) {
      res.status(404).json({ message: "Workflow step not found" });
      return;
    }
    
    if (req.body.status === "completed" && step.workflowId) {
      const allSteps = await storage.getWorkflowSteps(step.workflowId);
      const completedSteps = allSteps.filter(s => s.status === "completed").length;
      const progress = Math.round((completedSteps / allSteps.length) * 100);
      
      const workflowUpdate: any = { progress };
      if (progress === 100) {
        workflowUpdate.status = "completed";
        workflowUpdate.completedAt = new Date();
      } else if (progress > 0) {
        workflowUpdate.status = "in_progress";
      }
      
      await storage.updateWorkflow(step.workflowId, workflowUpdate);
    }
    
    res.json(step);
  }));

  // Tasks
  app.get("/api/tasks", asyncHandler(async (req, res) => {
    const { workflowId, assigneeId, status } = req.query;
    const tasks = await storage.getTasks({
      workflowId: workflowId as string,
      assigneeId: assigneeId as string,
      status: status as string,
    });
    res.json(tasks);
  }));

  app.get("/api/tasks/pending", asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const tasks = await storage.getPendingTasks(userId as string);
    res.json(tasks);
  }));

  app.get("/api/tasks/:id", asyncHandler(async (req, res) => {
    const task = await storage.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.json(task);
  }));

  app.post("/api/tasks", asyncHandler(async (req, res) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid task data", errors: parsed.error.errors });
      return;
    }
    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  }));

  app.patch("/api/tasks/:id", asyncHandler(async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.json(task);
  }));

  app.delete("/api/tasks/:id", asyncHandler(async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  }));

  // Notifications
  app.get("/api/notifications", asyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "userId required" });
      return;
    }
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  }));

  app.post("/api/notifications", asyncHandler(async (req, res) => {
    const parsed = insertNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid notification data", errors: parsed.error.errors });
      return;
    }
    const notification = await storage.createNotification(parsed.data);
    res.status(201).json(notification);
  }));

  app.patch("/api/notifications/:id/read", asyncHandler(async (req, res) => {
    const notification = await storage.markNotificationRead(req.params.id);
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json(notification);
  }));

  app.post("/api/notifications/mark-all-read", asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: "userId required" });
      return;
    }
    await storage.markAllNotificationsRead(userId);
    res.json({ success: true });
  }));

  // Audit Logs
  app.get("/api/audit-logs", asyncHandler(async (req, res) => {
    const { entityType, entityId, userId } = req.query;
    const logs = await storage.getAuditLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      userId: userId as string,
    });
    res.json(logs);
  }));

  // Dashboard & Reports
  app.get("/api/dashboard/stats", asyncHandler(async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  }));

  app.get("/api/reports/workflows", asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const metrics = await storage.getWorkflowMetrics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(metrics);
  }));

  // Seed Data
  app.post("/api/seed", asyncHandler(async (req, res) => {
    const hrDept = await storage.createDepartment({ name: "Human Resources", description: "HR department" });
    const itDept = await storage.createDepartment({ name: "Information Technology", description: "IT department" });
    const salesDept = await storage.createDepartment({ name: "Sales", description: "Sales department" });
    const engDept = await storage.createDepartment({ name: "Engineering", description: "Engineering department" });

    const hashedAdminPass = await bcrypt.hash("admin123", 10);
    const adminUser = await storage.createUser({
      email: "admin@company.com",
      username: "admin",
      password: hashedAdminPass,
      firstName: "System",
      lastName: "Admin",
      role: "admin",
      departmentId: itDept.id,
      avatarUrl: null,
      isActive: true,
    });

    const hashedHrPass = await bcrypt.hash("hr123", 10);
    const hrManager = await storage.createUser({
      email: "hr.manager@company.com",
      username: "hrmanager",
      password: hashedHrPass,
      firstName: "Jane",
      lastName: "Smith",
      role: "hr_manager",
      departmentId: hrDept.id,
      avatarUrl: null,
      isActive: true,
    });

    const emp1 = await storage.createEmployee({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      jobTitle: "Software Engineer",
      departmentId: engDept.id,
      status: "joining",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "New York",
      workType: "full-time",
    });

    const emp2 = await storage.createEmployee({
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice.johnson@company.com",
      jobTitle: "Sales Representative",
      departmentId: salesDept.id,
      status: "active",
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      location: "Chicago",
      workType: "full-time",
    });

    const emp3 = await storage.createEmployee({
      firstName: "Bob",
      lastName: "Williams",
      email: "bob.williams@company.com",
      jobTitle: "IT Support Specialist",
      departmentId: itDept.id,
      status: "moving",
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      location: "Remote",
      workType: "full-time",
    });

    const emp4 = await storage.createEmployee({
      firstName: "Carol",
      lastName: "Davis",
      email: "carol.davis@company.com",
      jobTitle: "Marketing Manager",
      departmentId: salesDept.id,
      status: "leaving",
      startDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: "Boston",
      workType: "full-time",
    });

    const joinerTemplate = await storage.createWorkflowTemplate({
      name: "Standard New Hire Onboarding",
      description: "Complete onboarding process for new employees",
      type: "joiner",
      status: "active",
      isDefault: true,
      estimatedDays: 5,
      createdBy: adminUser.id,
    });

    await storage.createTemplateStep({
      templateId: joinerTemplate.id,
      name: "IT Equipment Setup",
      description: "Provision laptop, phone, and accounts",
      stepOrder: 1,
      assigneeRole: "it_admin",
      slaMinutes: 480,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: joinerTemplate.id,
      name: "HR Documentation",
      description: "Complete onboarding paperwork and benefits enrollment",
      stepOrder: 2,
      assigneeRole: "hr_manager",
      slaMinutes: 240,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: joinerTemplate.id,
      name: "Team Introduction",
      description: "Schedule and conduct team introduction meeting",
      stepOrder: 3,
      assigneeRole: "manager",
      slaMinutes: 480,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: joinerTemplate.id,
      name: "Training Enrollment",
      description: "Enroll in required training courses",
      stepOrder: 4,
      assigneeRole: "hr_manager",
      slaMinutes: 120,
      isRequired: true,
    });

    const moverTemplate = await storage.createWorkflowTemplate({
      name: "Internal Transfer Process",
      description: "Process for employees moving between departments",
      type: "mover",
      status: "active",
      isDefault: true,
      estimatedDays: 3,
      createdBy: adminUser.id,
    });

    await storage.createTemplateStep({
      templateId: moverTemplate.id,
      name: "Update Access Permissions",
      description: "Revoke old permissions and grant new ones",
      stepOrder: 1,
      assigneeRole: "it_admin",
      slaMinutes: 240,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: moverTemplate.id,
      name: "Update HR Records",
      description: "Update department and reporting structure",
      stepOrder: 2,
      assigneeRole: "hr_manager",
      slaMinutes: 120,
      isRequired: true,
    });

    const leaverTemplate = await storage.createWorkflowTemplate({
      name: "Employee Offboarding",
      description: "Complete offboarding process for departing employees",
      type: "leaver",
      status: "active",
      isDefault: true,
      estimatedDays: 5,
      createdBy: adminUser.id,
    });

    await storage.createTemplateStep({
      templateId: leaverTemplate.id,
      name: "Knowledge Transfer",
      description: "Document and transfer key responsibilities",
      stepOrder: 1,
      assigneeRole: "manager",
      slaMinutes: 2400,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: leaverTemplate.id,
      name: "Exit Interview",
      description: "Conduct exit interview",
      stepOrder: 2,
      assigneeRole: "hr_manager",
      slaMinutes: 60,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: leaverTemplate.id,
      name: "Revoke Access",
      description: "Disable accounts and revoke all access",
      stepOrder: 3,
      assigneeRole: "it_admin",
      slaMinutes: 60,
      isRequired: true,
    });

    await storage.createTemplateStep({
      templateId: leaverTemplate.id,
      name: "Equipment Return",
      description: "Collect company equipment and assets",
      stepOrder: 4,
      assigneeRole: "it_admin",
      slaMinutes: 480,
      isRequired: true,
    });

    const workflow1 = await storage.createWorkflow({
      templateId: joinerTemplate.id,
      employeeId: emp1.id,
      name: `Onboarding: ${emp1.firstName} ${emp1.lastName}`,
      type: "joiner",
      status: "in_progress",
      initiatedBy: hrManager.id,
      progress: 25,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const templateSteps1 = await storage.getTemplateSteps(joinerTemplate.id);
    for (let i = 0; i < templateSteps1.length; i++) {
      const step = templateSteps1[i];
      await storage.createWorkflowStep({
        workflowId: workflow1.id,
        templateStepId: step.id,
        name: step.name,
        description: step.description,
        stepOrder: step.stepOrder,
        status: i === 0 ? "completed" : i === 1 ? "in_progress" : "pending",
        dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        startedAt: i <= 1 ? new Date() : null,
        completedAt: i === 0 ? new Date() : null,
      });
    }

    const workflow2 = await storage.createWorkflow({
      templateId: moverTemplate.id,
      employeeId: emp3.id,
      name: `Transfer: ${emp3.firstName} ${emp3.lastName}`,
      type: "mover",
      status: "pending",
      initiatedBy: hrManager.id,
      progress: 0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    const templateSteps2 = await storage.getTemplateSteps(moverTemplate.id);
    for (const step of templateSteps2) {
      await storage.createWorkflowStep({
        workflowId: workflow2.id,
        templateStepId: step.id,
        name: step.name,
        description: step.description,
        stepOrder: step.stepOrder,
        status: "pending",
        dueDate: new Date(Date.now() + step.stepOrder * 24 * 60 * 60 * 1000),
      });
    }

    const workflow3 = await storage.createWorkflow({
      templateId: leaverTemplate.id,
      employeeId: emp4.id,
      name: `Offboarding: ${emp4.firstName} ${emp4.lastName}`,
      type: "leaver",
      status: "in_progress",
      initiatedBy: hrManager.id,
      progress: 50,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    const templateSteps3 = await storage.getTemplateSteps(leaverTemplate.id);
    for (let i = 0; i < templateSteps3.length; i++) {
      const step = templateSteps3[i];
      await storage.createWorkflowStep({
        workflowId: workflow3.id,
        templateStepId: step.id,
        name: step.name,
        description: step.description,
        stepOrder: step.stepOrder,
        status: i < 2 ? "completed" : "pending",
        dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        startedAt: i < 2 ? new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000) : null,
        completedAt: i < 2 ? new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000) : null,
      });
    }

    await storage.createTask({
      workflowStepId: (await storage.getWorkflowSteps(workflow1.id))[1].id,
      workflowId: workflow1.id,
      title: "Complete I-9 verification",
      description: "Verify employment eligibility documentation",
      status: "pending",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    await storage.createTask({
      workflowStepId: (await storage.getWorkflowSteps(workflow1.id))[1].id,
      workflowId: workflow1.id,
      title: "Enroll in benefits",
      description: "Complete benefits enrollment for health, dental, vision",
      status: "in_progress",
      priority: "medium",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    await storage.createTask({
      workflowStepId: (await storage.getWorkflowSteps(workflow3.id))[2].id,
      workflowId: workflow3.id,
      title: "Disable Active Directory account",
      description: "Disable user's AD account and remove from groups",
      status: "pending",
      priority: "high",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    });

    res.json({ 
      message: "Seed data created successfully",
      data: { departments: 4, users: 2, employees: 4, templates: 3, workflows: 3 }
    });
  }));

  return httpServer;
}
