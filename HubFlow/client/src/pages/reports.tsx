import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  PieChartIcon,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Workflow, Employee } from "@shared/schema";

interface WorkflowMetrics {
  totalWorkflows: number;
  completedWorkflows: number;
  avgCompletionDays: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

interface DashboardStats {
  activeWorkflows: number;
  pendingTasks: number;
  completedThisWeek: number;
  joiningCount: number;
  movingCount: number;
  leavingCount: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
  blocked: "#ef4444",
  cancelled: "#6b7280",
};

const TYPE_COLORS: Record<string, string> = {
  joiner: "#10b981",
  mover: "#3b82f6",
  leaver: "#f59e0b",
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: metrics, isLoading: metricsLoading } = useQuery<WorkflowMetrics>({
    queryKey: ["/api/reports/workflows"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const typeData = metrics?.byType.map((item) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
    fill: TYPE_COLORS[item.type] || COLORS[0],
  })) || [];

  const statusData = metrics?.byStatus.map((item) => ({
    name: item.status.replace("_", " ").charAt(0).toUpperCase() + item.status.replace("_", " ").slice(1),
    value: item.count,
    fill: STATUS_COLORS[item.status] || COLORS[0],
  })) || [];

  const jmlBreakdown = [
    { name: "Joiners", value: stats?.joiningCount || 0, fill: "#10b981" },
    { name: "Movers", value: stats?.movingCount || 0, fill: "#3b82f6" },
    { name: "Leavers", value: stats?.leavingCount || 0, fill: "#f59e0b" },
  ];

  const completionRate = metrics?.totalWorkflows
    ? Math.round((metrics.completedWorkflows / metrics.totalWorkflows) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for JML processes</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-time-range">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Workflows"
          value={metrics?.totalWorkflows || 0}
          description="All time"
          icon={BarChart3}
          loading={metricsLoading}
        />
        <MetricCard
          title="Completion Rate"
          value={`${completionRate}%`}
          description="Workflows completed"
          icon={CheckCircle2}
          loading={metricsLoading}
        />
        <MetricCard
          title="Avg Completion"
          value={`${metrics?.avgCompletionDays || 0} days`}
          description="Average time to complete"
          icon={Clock}
          loading={metricsLoading}
        />
        <MetricCard
          title="Active Employees"
          value={employees?.filter((e) => e.status !== "departed").length || 0}
          description="In JML pipeline"
          icon={Users}
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Workflows by Status
            </CardTitle>
            <CardDescription>Distribution of workflow statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : statusData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Workflow by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Workflows by Type
            </CardTitle>
            <CardDescription>Distribution across JML categories</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : typeData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* JML Pipeline Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current JML Pipeline
            </CardTitle>
            <CardDescription>Employees currently in JML processes</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={jmlBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {jmlBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Active Workflows</span>
                <span className="text-2xl font-bold" data-testid="stat-active-workflows">
                  {stats?.activeWorkflows || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Pending Tasks</span>
                <span className="text-2xl font-bold" data-testid="stat-pending-tasks">
                  {stats?.pendingTasks || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Completed This Week</span>
                <span className="text-2xl font-bold" data-testid="stat-completed-week">
                  {stats?.completedThisWeek || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-2xl font-bold text-emerald-600" data-testid="stat-completion-rate">
                  {completionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
