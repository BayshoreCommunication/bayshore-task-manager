"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/types";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaults?: Partial<Task>;
}

export function TaskModal({ open, onClose, task, defaults }: TaskModalProps) {
  const { me, users, projects, createTask, updateTask } = useAppStore();
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [details, setDetails] = useState(task?.details ?? "");
  const [assignees, setAssignees] = useState<string[]>(
    task?.assignees ?? defaults?.assignees ?? (me ? [me.id] : []),
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : (defaults?.dueDate ?? ""),
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? defaults?.priority ?? "medium",
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pending");
  const [type, setType] = useState<TaskType>(
    task?.type ?? defaults?.type ?? "universal",
  );
  const [projectId, setProjectId] = useState<string | null>(
    task?.projectId ?? defaults?.projectId ?? null,
  );
  const [saving, setSaving] = useState(false);

  // Reset on open
  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  const toggleAssignee = (id: string) =>
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!assignees.length) {
      toast.error("Assign at least one person");
      return;
    }
    setSaving(true);
    if (isEdit && task) {
      await updateTask(task.id, {
        title,
        details,
        assignees,
        dueDate,
        priority,
        status,
        type,
        projectId,
      });
      toast.success("Task updated");
    } else {
      await createTask({
        title,
        details,
        assignees,
        dueDate,
        priority,
        status,
        type,
        projectId,
        muted: false,
        createdBy: me?.id ?? "",
      });
      toast.success("Task created");
    }
    setSaving(false);
    onClose();
  };

  const activeUsers = users.filter((u) => !u.muted);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Details</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Description, context, links…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    assignees.includes(u.id)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-transparent text-muted-foreground hover:bg-accent",
                  )}
                  disabled={type === "private"}
                >
                  <UserAvatar user={u} size="xs" />
                  {u.name.split(" ")[0]}
                  {assignees.includes(u.id) && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TaskType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal">Universal (Team)</SelectItem>
                  <SelectItem value="private">Private (Only Me)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Project (optional)</Label>

              <Select
                value={projectId || "none"}
                onValueChange={(v) => setProjectId(v === "none" ? null : v)}
                disabled={type === "private"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>

                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
