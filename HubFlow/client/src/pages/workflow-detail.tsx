import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Circle,
  User,
  Mail,
  Briefcase,
  Calendar,
} from "lucide-react";
import type { Workflow, WorkflowStep, Employee } from "@shared/schema";

interface WorkflowWithDetails extends Workflow {
  steps: WorkflowStep[];
  employee: Employee;
}

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "in_progress":
      return <Play className="h-5 w-5 text-blue-500" />;
    case "blocked":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "skipped":
      return <Circle className="h-5 w-5 text-gray-400" />;
    default:
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
}

function StepStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    pending: { className: "status-neutral", label: "Pending" },
    in_progress: { className: "status-info", label: "In Progress" },
    completed: { className: "status-success", label: "Completed" },
    blocked: { className: "status-error", label: "Blocked" },
    skipped: { className: "status-neutral", label: "Skipped" },
  };

  const { className, label } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={className}>
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

  const { className, icon: Icon } = config[type] || { className: "status-neutral", icon: Circle };

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: workflow, isLoading } = useQuery<WorkflowWithDetails>({
    queryKey: ["/api/workflows", id],
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, status }: { stepId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/workflow-steps/${stepId}`, {
        status,
        completedAt: status === "completed" ? new Date() : null,
        startedAt: status === "in_progress" ? new Date() : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Step updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update step", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Workflow not found</h3>
            <Link href="/workflows">
              <Button variant="link">Back to workflows</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedSteps = workflow.steps.filter((s) => s.status === "completed").length;
  const totalSteps = workflow.steps.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/workflows">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-workflow-name">{workflow.name}</h1>
            <WorkflowTypeBadge type={workflow.type} />
          </div>
          <p className="text-muted-foreground">
            {completedSteps} of {totalSteps} steps completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold">{workflow.progress}%</div>
            <div className="text-sm text-muted-foreground">Progress</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Timeline</CardTitle>
              <CardDescription>Track progress through each step</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 pb-8 last:pb-0" data-testid={`step-${step.id}`}>
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <StepStatusIcon status={step.status} />
                      {index < workflow.steps.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 mt-2 ${
                            step.status === "completed" ? "bg-emerald-500" : "bg-border"
                          }`}
                        />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="font-medium" data-testid={`text-step-name-${step.id}`}>{step.name}</h4>
                          {step.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            {step.startedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Started: {new Date(step.startedAt).toLocaleString()}
                              </span>
                            )}
                            {step.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed: {new Date(step.completedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StepStatusBadge status={step.status} />
                          {step.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStepMutation.mutate({
                                  stepId: step.id,
                                  status: "in_progress",
                                })
                              }
                              disabled={updateStepMutation.isPending}
                              data-testid={`button-start-step-${step.id}`}
                            >
                              Start
                            </Button>
                          )}
                          {step.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStepMutation.mutate({
                                  stepId: step.id,
                                  status: "completed",
                                })
                              }
                              disabled={updateStepMutation.isPending}
                              data-testid={`button-complete-step-${step.id}`}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              {workflow.employee ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {workflow.employee.firstName[0]}
                        {workflow.employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg" data-testid="text-employee-name">
                        {workflow.employee.firstName} {workflow.employee.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {workflow.employee.jobTitle}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{workflow.employee.email}</span>
                    </div>
                    {workflow.employee.location && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{workflow.employee.location}</span>
                      </div>
                    )}
                    {workflow.employee.startDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Starts: {new Date(workflow.employee.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Employee information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge
                  variant="outline"
                  className={
                    workflow.status === "completed"
                      ? "status-success"
                      : workflow.status === "in_progress"
                      ? "status-info"
                      : workflow.status === "blocked"
                      ? "status-error"
                      : "status-pending"
                  }
                >
                  {workflow.status.replace("_", " ").charAt(0).toUpperCase() +
                    workflow.status.replace("_", " ").slice(1)}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <Progress value={workflow.progress} className="flex-1" />
                  <span className="text-sm font-medium">{workflow.progress}%</span>
                </div>
              </div>
              {workflow.startDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Started</div>
                  <div className="text-sm">
                    {new Date(workflow.startDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {workflow.dueDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                  <div className="text-sm">
                    {new Date(workflow.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
