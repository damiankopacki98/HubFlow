import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Search,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import type { Employee, Department } from "@shared/schema";

function EmployeeStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; icon: React.ElementType; label: string }> = {
    joining: { className: "status-success", icon: UserPlus, label: "Joining" },
    active: { className: "status-info", icon: Users, label: "Active" },
    moving: { className: "status-warning", icon: ArrowRightLeft, label: "Moving" },
    leaving: { className: "status-error", icon: UserMinus, label: "Leaving" },
    departed: { className: "status-neutral", icon: UserMinus, label: "Departed" },
  };

  const { className, icon: Icon, label } = config[status] || config.active;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

function AddEmployeeDialog({ departments }: { departments: Department[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    departmentId: "",
    status: "joining" as const,
    location: "",
    startDate: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/employees", {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        jobTitle: "",
        departmentId: "",
        status: "joining",
        location: "",
        startDate: "",
      });
      toast({ title: "Employee added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add employee", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-employee">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the details of the new employee to start their JML process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                required
                data-testid="input-job-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joining">Joining</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="moving">Moving</SelectItem>
                    <SelectItem value="leaving">Leaving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  data-testid="input-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-employee">
              {mutation.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Employees() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get status from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const urlStatus = urlParams.get("status");

  const effectiveStatus = urlStatus || statusFilter;

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", effectiveStatus !== "all" ? effectiveStatus : undefined],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = effectiveStatus === "all" || emp.status === effectiveStatus;

    return matchesSearch && matchesStatus;
  });

  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || "Unknown";
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Employees</h1>
          <p className="text-muted-foreground">Manage employees and their JML processes</p>
        </div>
        <AddEmployeeDialog departments={departments} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-employees"
          />
        </div>
        <Select
          value={effectiveStatus}
          onValueChange={(value) => {
            setStatusFilter(value);
            if (value === "all") {
              setLocation("/employees");
            } else {
              setLocation(`/employees?status=${value}`);
            }
          }}
        >
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="joining">Joining</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="moving">Moving</SelectItem>
            <SelectItem value="leaving">Leaving</SelectItem>
            <SelectItem value="departed">Departed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEmployees?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No employees found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add employees to start managing JML processes"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees?.map((employee) => (
            <Card key={employee.id} className="hover-elevate cursor-pointer" data-testid={`card-employee-${employee.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" data-testid={`text-employee-name-${employee.id}`}>
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {employee.jobTitle}
                    </p>
                    <div className="mt-2">
                      <EmployeeStatusBadge status={employee.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-3 w-3 flex-shrink-0" />
                    {getDepartmentName(employee.departmentId)}
                  </p>
                  {employee.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {employee.location}
                    </p>
                  )}
                  {employee.startDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      Starts: {new Date(employee.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
