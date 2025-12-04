import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  UserPlus,
  ArrowRightLeft,
  UserMinus,
  FileText,
  Clock,
  CheckCircle,
  Trash2,
  Edit,
  Copy,
  ListOrdered,
} from "lucide-react";
import type { WorkflowTemplate, TemplateStep } from "@shared/schema";

interface TemplateWithSteps extends WorkflowTemplate {
  steps?: TemplateStep[];
}

function TemplateTypeBadge({ type }: { type: string }) {
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

function TemplateStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    draft: { className: "status-neutral", label: "Draft" },
    active: { className: "status-success", label: "Active" },
    archived: { className: "status-warning", label: "Archived" },
  };

  const { className, label } = config[status] || config.draft;

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

interface TemplateStep {
  name: string;
  description: string;
  stepOrder: number;
  assigneeRole: string;
  slaMinutes: number;
  isRequired: boolean;
}

function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "joiner" as const,
    estimatedDays: 5,
    steps: [] as TemplateStep[],
  });
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    assigneeRole: "hr_manager",
    slaMinutes: 480,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const steps = data.steps.map((step, index) => ({
        ...step,
        stepOrder: index + 1,
        isRequired: true,
      }));
      const res = await apiRequest("POST", "/api/templates", {
        name: data.name,
        description: data.description,
        type: data.type,
        status: "draft",
        estimatedDays: data.estimatedDays,
        steps,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "joiner",
        estimatedDays: 5,
        steps: [],
      });
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const addStep = () => {
    if (!newStep.name) return;
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          ...newStep,
          stepOrder: formData.steps.length + 1,
          isRequired: true,
        },
      ],
    });
    setNewStep({
      name: "",
      description: "",
      assigneeRole: "hr_manager",
      slaMinutes: 480,
    });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Workflow Template</DialogTitle>
            <DialogDescription>
              Design a reusable template for JML processes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard New Hire Onboarding"
                required
                data-testid="input-template-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this template is for..."
                data-testid="input-template-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joiner">Joiner</SelectItem>
                    <SelectItem value="mover">Mover</SelectItem>
                    <SelectItem value="leaver">Leaver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDays">Estimated Days</Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  min={1}
                  value={formData.estimatedDays}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedDays: parseInt(e.target.value) || 1 })
                  }
                  data-testid="input-estimated-days"
                />
              </div>
            </div>

            {/* Steps Section */}
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Workflow Steps</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.steps.length} step(s)
                </span>
              </div>

              {/* Existing Steps */}
              {formData.steps.length > 0 && (
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{step.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Assigned to: {step.assigneeRole.replace("_", " ")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Step Form */}
              <div className="space-y-3 p-4 border rounded-md">
                <Label className="text-sm">Add New Step</Label>
                <div className="grid gap-3">
                  <Input
                    placeholder="Step name"
                    value={newStep.name}
                    onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                    data-testid="input-step-name"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newStep.description}
                    onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                    data-testid="input-step-description"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={newStep.assigneeRole}
                      onValueChange={(value) => setNewStep({ ...newStep, assigneeRole: value })}
                    >
                      <SelectTrigger data-testid="select-step-role">
                        <SelectValue placeholder="Assignee role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr_manager">HR Manager</SelectItem>
                        <SelectItem value="it_admin">IT Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="SLA (minutes)"
                      value={newStep.slaMinutes}
                      onChange={(e) =>
                        setNewStep({ ...newStep, slaMinutes: parseInt(e.target.value) || 60 })
                      }
                      data-testid="input-step-sla"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStep}
                    disabled={!newStep.name}
                    data-testid="button-add-step"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !formData.name}
              data-testid="button-submit-template"
            >
              {mutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Templates() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<TemplateWithSteps[]>({
    queryKey: ["/api/templates"],
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/templates/${id}`, { status: "active" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template activated" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/templates/${id}`, { status: "archived" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template archived" });
    },
  });

  const filteredTemplates = templates?.filter((t) => {
    return typeFilter === "all" || t.type === typeFilter;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Workflow Templates</h1>
          <p className="text-muted-foreground">Manage reusable JML workflow templates</p>
        </div>
        <CreateTemplateDialog />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No templates found</h3>
            <p className="text-muted-foreground text-sm">
              Create a template to start automating JML processes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates?.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate" data-testid={`text-template-name-${template.id}`}>
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <TemplateTypeBadge type={template.type} />
                      <TemplateStatusBadge status={template.status} />
                    </div>
                  </div>
                </div>
                {template.description && (
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {template.estimatedDays && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimatedDays} days
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ListOrdered className="h-3 w-3" />
                    v{template.version}
                  </span>
                  {template.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {template.status === "draft" && (
                    <Button
                      size="sm"
                      onClick={() => activateMutation.mutate(template.id)}
                      disabled={activateMutation.isPending}
                      data-testid={`button-activate-${template.id}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  )}
                  {template.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveMutation.mutate(template.id)}
                      disabled={archiveMutation.isPending}
                      data-testid={`button-archive-${template.id}`}
                    >
                      Archive
                    </Button>
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
