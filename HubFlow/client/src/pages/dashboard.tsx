import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import type { Workflow, Task } from "@shared/schema";

interface DashboardStats {
  activeWorkflows: number;
  pendingTasks: number;
  completedThisWeek: number;
  joiningCount: number;
  movingCount: number;
  leavingCount: number;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend && (
            <span className={trend.positive ? "text-emerald-600" : "text-red-600"}>
              <TrendingUp className={`h-3 w-3 inline ${!trend.positive ? "rotate-180" : ""}`} />
              {trend.value}%
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function WorkflowStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "status-pending",
    in_progress: "status-info",
    completed: "status-success",
    blocked: "status-error",
    cancelled: "status-neutral",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    blocked: "Blocked",
    cancelled: "Cancelled",
  };

  return (
    <Badge variant="outline" className={variants[status] || "status-neutral"}>
      {labels[status] || status}
    </Badge>
  );
}

function WorkflowTypeBadge({ type }: { type: string }) {
  const variants: Record<string, { className: string; icon: React.ElementType }> = {
    joiner: { className: "status-success", icon: UserPlus },
    mover: { className: "status-info", icon: ArrowRightLeft },
    leaver: { className: "status-warning", icon: UserMinus },
  };

  const config = variants[type] || { className: "status-neutral", icon: Users };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/pending"],
  });

  const recentWorkflows = workflows?.slice(0, 5) || [];
  const pendingTasks = tasks?.slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your JML automation processes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Workflows"
          value={stats?.activeWorkflows || 0}
          description="Currently in progress"
          icon={Activity}
          loading={statsLoading}
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          description="Awaiting action"
          icon={Clock}
          loading={statsLoading}
        />
        <StatCard
          title="Completed This Week"
          value={stats?.completedThisWeek || 0}
          description="Workflows finished"
          icon={CheckCircle2}
          loading={statsLoading}
        />
        <StatCard
          title="Total in Pipeline"
          value={
            (stats?.joiningCount || 0) +
            (stats?.movingCount || 0) +
            (stats?.leavingCount || 0)
          }
          description="Joiners, movers, leavers"
          icon={Users}
          loading={statsLoading}
        />
      </div>

      {/* JML Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Joiners</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600" data-testid="stat-joiners">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.joiningCount || 0}
            </div>
            <p className="text-sm text-muted-foreground">New employees onboarding</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Movers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="stat-movers">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.movingCount || 0}
            </div>
            <p className="text-sm text-muted-foreground">Internal transfers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Leavers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600" data-testid="stat-leavers">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.leavingCount || 0}
            </div>
            <p className="text-sm text-muted-foreground">Employees offboarding</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Workflows */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Workflows</CardTitle>
            <CardDescription>Latest JML processes in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {workflowsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentWorkflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active workflows</p>
                <p className="text-sm">Start a new workflow to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`workflow-item-${workflow.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{workflow.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <WorkflowTypeBadge type={workflow.type} />
                        <WorkflowStatusBadge status={workflow.status} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Progress value={workflow.progress} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {workflow.progress}% complete
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Tasks</CardTitle>
            <CardDescription>Tasks requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>All caught up!</p>
                <p className="text-sm">No pending tasks at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="mt-0.5">
                      {task.priority === "high" ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        task.priority === "high"
                          ? "status-error"
                          : task.priority === "medium"
                          ? "status-warning"
                          : "status-neutral"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
