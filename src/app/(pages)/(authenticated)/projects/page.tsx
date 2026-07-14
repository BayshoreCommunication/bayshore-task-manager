"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarStack } from "@/components/shared/UserAvatar";
import { ProjectStatusBadge } from "@/components/shared/Badges";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { PROJECT_COLORS, PROJECT_STATUS_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { ProjectStatus } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { me, users, tasks, projects, createProject, isElevated } =
    useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [status, setStatus] = useState<ProjectStatus>("in_pipeline");
  const [members, setMembers] = useState<string[]>(me ? [me.id] : []);

  if (!me) return null;

  const myProjects = isElevated()
    ? projects
    : projects.filter((p) => p.members.includes(me.id));

  const toggle = (id: string) =>
    setMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    await createProject({
      name,
      description: desc,
      color,
      status,
      members,
      createdBy: me.id,
    });
    toast.success("Project created");
    setShowForm(false);
    setName("");
    setDesc("");
    setColor(PROJECT_COLORS[0]);
    setStatus("in_pipeline");
    setMembers([me.id]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-base">Projects</h2>
        {isElevated() && (
          <Button size="sm" onClick={() => setShowForm((o) => !o)}>
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardContent className="pt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ProjectStatus)}
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
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all duration-150",
                        color === c
                          ? "ring-2 ring-offset-2 ring-foreground scale-110"
                          : "ring-1 ring-transparent hover:scale-105",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Members</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {users
                    .filter((u) => !u.muted)
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggle(u.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                          members.includes(u.id)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted border-transparent text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {u.name.split(" ")[0]}
                        {members.includes(u.id) && (
                          <Check className="h-2.5 w-2.5" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleCreate}>
                Create Project
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {myProjects.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No projects yet
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myProjects.map((p) => {
            const projTasks = tasks.filter(
              (t) => t.projectId === p.id && !t.muted,
            );
            const donePct = projTasks.length
              ? Math.round(
                  (projTasks.filter((t) => t.status === "done").length /
                    projTasks.length) *
                    100,
                )
              : 0;
            return (
              <div
                key={p.id}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
                onClick={() => router.push(`/projects/${p.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: p.color }}
                    />
                    <h3 className="font-bold text-sm">{p.name}</h3>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{projTasks.length} tasks</span>
                  <span>{donePct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${donePct}%`, background: p.color }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <AvatarStack
                    userIds={p.members}
                    users={users}
                    max={4}
                    size="xs"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {projTasks.filter((t) => t.status === "done").length}/
                    {projTasks.length} done
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
