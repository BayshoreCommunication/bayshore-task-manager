"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  Plus,
  Edit2,
  Users,
  Paperclip,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskModal } from "@/components/tasks/TaskModal";
import { StatCard } from "@/components/shared/StatCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ProjectStatusBadge } from "@/components/shared/Badges";
import { cn, uid, now, today, fmtTime, fileToBase64 } from "@/lib/utils";
import {
  PROJECT_COLORS,
  PROJECT_STATUS_CONFIG,
  ROLE_CONFIG,
} from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { ProjectDoc, ProjectStatus } from "@/types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    me,
    users,
    tasks,
    projects,
    updateProject,
    toggleProjectMember,
    isElevated,
    can,
  } = useAppStore();

  const project = projects.find((p) => p.id === id);
  const [editMode, setEditMode] = useState(false);
  const [membersMode, setMembersMode] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState(project?.name ?? "");
  const [editDesc, setEditDesc] = useState(project?.description ?? "");
  const [editColor, setEditColor] = useState(
    project?.color ?? PROJECT_COLORS[0],
  );
  const [editStatus, setEditStatus] = useState<ProjectStatus>(
    project?.status ?? "active",
  );

  if (!project) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Project not found.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/projects")}
        >
          ← Back
        </Button>
      </div>
    );
  }

  const projTasks = tasks.filter((t) => t.projectId === id && !t.muted);
  const members = users.filter((u) => project.members.includes(u.id));
  const nonMembers = users.filter(
    (u) => !u.muted && !project.members.includes(u.id),
  );

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.error("Name required");
      return;
    }
    await updateProject(id, {
      name: editName,
      description: editDesc,
      color: editColor,
      status: editStatus,
    });
    toast.success("Project updated");
    setEditMode(false);
  };

  const addDocLink = async () => {
    if (!docUrl.trim()) return;
    const doc: ProjectDoc = {
      id: uid(),
      type: "link",
      name: docName || docUrl,
      url: docUrl,
      addedBy: me!.id,
      at: now(),
    };
    await updateProject(id, { docs: [...(project.docs ?? []), doc] });
    setDocUrl("");
    setDocName("");
    toast.success("Link added");
  };

  const addDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await fileToBase64(file);
    const type = file.type.startsWith("image/")
      ? ("image" as const)
      : ("pdf" as const);
    const doc: ProjectDoc = {
      id: uid(),
      type,
      name: file.name,
      data,
      addedBy: me!.id,
      at: now(),
    };
    await updateProject(id, { docs: [...(project.docs ?? []), doc] });
    e.target.value = "";
    toast.success("Document uploaded");
  };

  const removeDoc = async (docId: string) => {
    await updateProject(id, {
      docs: (project.docs ?? []).filter((d) => d.id !== docId),
    });
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/projects")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: project.color }}
        />
        <h2 className="font-black text-lg flex-1">{project.name}</h2>
        <ProjectStatusBadge status={project.status} />
        {isElevated() && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditMode((o) => !o);
                setMembersMode(false);
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
              {editMode ? "Close Edit" : "Edit"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMembersMode((o) => !o);
                setEditMode(false);
              }}
            >
              <Users className="h-3.5 w-3.5" />
              {membersMode ? "Done" : "Members"}
            </Button>
            <Button size="sm" onClick={() => setShowTaskModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        )}
      </div>

      {/* Edit form */}
      {editMode && (
        <Card className="border-primary">
          <CardContent className="pt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-6 h-6 rounded-full"
                      style={{
                        background: c,
                        outline:
                          editColor === c
                            ? "3px solid hsl(var(--foreground))"
                            : "3px solid transparent",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit}>
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tasks" value={projTasks.length} color="#4f8ef7" />
        <StatCard
          label="Done"
          value={projTasks.filter((t) => t.status === "done").length}
          color="#16a34a"
        />
        <StatCard
          label="In Progress"
          value={projTasks.filter((t) => t.status === "in_progress").length}
          color="#d97706"
        />
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {members.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <UserAvatar user={u} size="xs" />
                <div>
                  <span className="text-xs font-semibold">
                    {u.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {ROLE_CONFIG[u.role].label}
                  </span>
                </div>
                {membersMode && isElevated() && members.length > 1 && (
                  <button
                    onClick={() => {
                      toggleProjectMember(id, u.id);
                      toast.success(`Removed ${u.name.split(" ")[0]}`);
                    }}
                    className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center ml-1 hover:opacity-80"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {membersMode && nonMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Add people
              </p>
              <div className="flex flex-wrap gap-2">
                {nonMembers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      toggleProjectMember(id, u.id);
                      toast.success(`Added ${u.name.split(" ")[0]}`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted border border-dashed border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <UserAvatar user={u} size="xs" />
                    {u.name.split(" ")[0]}
                    <Plus className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Documents ({(project.docs ?? []).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(project.docs ?? []).length > 0 && (
            <div className="space-y-2">
              {(project.docs ?? []).map((d) => {
                const addedBy = users.find((u) => u.id === d.addedBy);
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-2.5 bg-muted rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center text-sm shrink-0">
                      {d.type === "pdf"
                        ? "📄"
                        : d.type === "image"
                          ? "🖼️"
                          : "🔗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      {d.type === "link" ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary truncate block"
                        >
                          {d.name}
                        </a>
                      ) : (
                        <p className="text-sm font-medium truncate">{d.name}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {d.type.toUpperCase()} · {addedBy?.name.split(" ")[0]} ·{" "}
                        {fmtTime(d.at)}
                      </p>
                    </div>
                    {(d.type === "image" || d.type === "pdf") && d.data && (
                      <a href={d.data} download={d.name}>
                        <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    {isElevated() && (
                      <button
                        onClick={() => removeDoc(d.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {isElevated() && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Name (optional)"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="Paste URL…"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="flex-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addDocLink()}
                />
                <Button size="sm" onClick={addDocLink}>
                  Add Link
                </Button>
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Upload PDF or Image
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={addDocFile}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      {projTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm py-6 text-center">
          No tasks yet — add the first one!
        </p>
      ) : (
        <TaskTable tasks={projTasks} showAssignee />
      )}

      {showTaskModal && (
        <TaskModal
          open
          defaults={{ type: "universal", projectId: id }}
          onClose={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}
