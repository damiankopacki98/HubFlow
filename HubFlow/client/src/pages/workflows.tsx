import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  FileText,
} from "lucide-react";
import type { Workflow, WorkflowTemplate, Employee } from "@shared/schema";

function WorkflowStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; icon: React.ElementType; label: string }> = {
    pending: { className: "status-pending", icon: Clock, label: "Pending" },
    in_progress: { className: "status-info", icon: Play, label: "In Progress" },
    completed: { className: "status-success", icon: CheckCircle2, label: "Completed" },
    blocked: { className: "status-error", icon: AlertCircle, label: "Blocked" },
    cancelled: { className: "status-neutral", icon: AlertCircle, label: "Cancelled" },
  };

  const { className, icon: Icon, label } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

function WorkflowTypeBadge({ type }: { type: string }) {
  const config: Record<string, { className: string; icon: React.ElementType }> = {
    joiner: { className: "status-success", icon: UserPlus },
    mover: { className: "status-info", icon: ArrowRightLeft },
    leaver: { className: "status-warning", icon: UserMinus },
  };

  const { className, icon: Icon } = config[type] || { className: "status-neutral", icon: FileText };

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function StartWorkflowDialog({
  templates,
  employees,
}: {
  templates: WorkflowTemplate[];
  employees: Employee[];
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    templateId: "",
    employeeId: "",
  });

  const activeTemplates = templates.filter((t) => t.status === "active");
  const eligibleEmployees = employees.filter((e) =>
    ["joining", "moving", "leaving"].includes(e.status)
  );

  const selectedTemplate = activeTemplates.find((t) => t.id === formData.templateId);
  const selectedEmployee = eligibleEmployees.find((e) => e.id === formData.employeeId);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const template = activeTemplates.find((t) => t.id === data.templateId);
      const employee = eligibleEmployees.find((e) => e.id === data.employeeId);
      
      if (!template || !employee) throw new Error("Invalid selection");

      const res = await apiRequest("POST", "/api/workflows", {
        templateId: data.templateId,
        employeeId: data.employeeId,
        name: `${template.name}: ${employee.firstName} ${employee.lastName}`,
        type: template.type,
        status: "pending",
        initiatedBy: "system",
        progress: 0,
        startDate: new Date(),
        dueDate: template.estimatedDays
          ? new Date(Date.now() + template.estimatedDays * 24 * 60 * 60 * 1000)
          : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setOpen(false);
      setFormData({ templateId: "", employeeId: "" });
      toast({ title: "Workflow started successfully" });
    },
    onError: () => {
      toast({ title: "Failed to start workflow", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-start-workflow">
          <Plus className="h-4 w-4 mr-2" />
          Start Workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start New Workflow</DialogTitle>
            <DialogDescription>
              Select a template and employee to initiate a new JML workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template">Workflow Template</Label>
              <Select
                value={formData.templateId}
                onValueChange={(value) => setFormData({ ...formData, templateId: value })}
              >
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <WorkflowTypeBadge type={template.type} />
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {employee.firstName} {employee.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {employee.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <p className="text-xs text-muted-foreground">
                  {selectedEmployee.jobTitle} - {selectedEmployee.email}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !formData.templateId || !formData.employeeId}
              data-testid="button-confirm-workflow"
            >
              {mutation.isPending ? "Starting..." : "Start Workflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Workflows() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: templates = [] } = useQuery<WorkflowTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const filteredWorkflows = workflows?.filter((wf) => {
    const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
    const matchesType = typeFilter === "all" || wf.type === typeFilter;
    return matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Workflows</h1>
          <p className="text-muted-foreground">Manage active JML processes</p>
        </div>
        <StartWorkflowDialog templates={templates} employees={employees} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="joiner">Joiner</SelectItem>
            <SelectItem value="mover">Mover</SelectItem>
            <SelectItem value="leaver">Leaver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflows List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWorkflows?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No workflows found</h3>
            <p className="text-muted-foreground text-sm">
              Start a new workflow to begin processing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows?.map((workflow) => (
            <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold truncate" data-testid={`text-workflow-name-${workflow.id}`}>
                        {workflow.name}
                      </h3>
                      <WorkflowTypeBadge type={workflow.type} />
                      <WorkflowStatusBadge status={workflow.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {workflow.startDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started: {new Date(workflow.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {workflow.dueDate && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Due: {new Date(workflow.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{workflow.progress}%</div>
                      <Progress value={workflow.progress} className="w-24 h-2" />
                    </div>
                    <Link href={`/workflows/${workflow.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-workflow-${workflow.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
