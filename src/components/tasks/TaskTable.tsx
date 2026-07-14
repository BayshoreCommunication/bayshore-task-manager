"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Edit2,
  VolumeX,
  Volume2,
  ChevronUp,
  ChevronDown,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarStack } from "@/components/shared/UserAvatar";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { TaskModal } from "@/components/tasks/TaskModal";
import { DetailModal } from "@/components/tasks/DetailModal";
import { cn, fmt, isOverdue } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { getPriorityColor } from "@/lib/getTaskPriorityColor";

interface TaskTableProps {
  tasks: Task[];
  showAssignee?: boolean;
  isArchive?: boolean;
  emptyText?: string;
}

type SortKey = "title" | "dueDate" | "priority" | "status";

export function TaskTable({
  tasks,
  showAssignee = true,
  isArchive = false,
  emptyText = "No tasks",
}: TaskTableProps) {
  const { users, can, updateTask, toggleMuteTask, setTasks, me } =
    useAppStore();
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return av.localeCompare(bv) * (sortDir === "asc" ? 1 : -1);
  });

  const handleDelete = async (t: Task) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const res = await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete task");
        return;
      }
      setTasks(tasks.filter((x) => x.id !== t.id));
      toast.success("Task deleted");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const SortTh = ({
    col,
    children,
  }: {
    col: SortKey;
    children: React.ReactNode;
  }) => (
    <th
      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon col={col} />
      </span>
    </th>
  );

  if (!me) return null;

  if (!tasks.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <SortTh col="title">Task</SortTh>
                {showAssignee && (
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assignees
                  </th>
                )}
                <SortTh col="dueDate">Due</SortTh>
                <SortTh col="priority">Priority</SortTh>
                <SortTh col="status">Status</SortTh>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((t) => {
                const overdue = isOverdue(t.dueDate, t.status);
                const priorityColor = getPriorityColor(t.priority);
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "hover:bg-muted/40 cursor-pointer transition-colors",
                      t.muted && "opacity-50",
                    )}
                    onClick={() => setDetailTask(t)}
                  >
                    <td
                      className={cn(
                        "px-3 py-3 max-w-55 border-l-4",
                        priorityColor.border,
                      )}
                    >
                      <div className="font-medium truncate">{t.title}</div>
                      {t.details && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {t.details}
                        </div>
                      )}
                      {(t.attachments?.length ?? 0) > 0 && (
                        <div className="text-[11px] text-primary mt-0.5">
                          📎 {t.attachments.length}
                        </div>
                      )}
                    </td>

                    {showAssignee && (
                      <td className="px-3 py-3">
                        <AvatarStack
                          userIds={t.assignees}
                          users={users}
                          max={3}
                          size="xs"
                        />
                      </td>
                    )}
                    <td
                      className="px-3 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {can("edit_task") ? (
                        <input
                          type="date"
                          className="text-xs bg-transparent border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
                          style={{
                            color: overdue
                              ? "hsl(var(--destructive))"
                              : undefined,
                          }}
                          value={t.dueDate ? t.dueDate.split("T")[0] : ""}
                          onChange={(e) =>
                            updateTask(t.id, { dueDate: e.target.value })
                          }
                          disabled={
                            me.role !== "admin" &&
                            me.role !== "o_level" &&
                            !t.assignees.includes(me.id)
                          }
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-xs",
                            overdue && "text-destructive font-semibold",
                          )}
                        >
                          {fmt(t.dueDate)}
                        </span>
                      )}
                    </td>
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {can("edit_task") ? (
                        <Select
                          value={t.priority}
                          onValueChange={(v) =>
                            updateTask(t.id, { priority: v as TaskPriority })
                          }
                          disabled={
                            me.role !== "admin" &&
                            me.role !== "o_level" &&
                            !t.assignees.includes(me.id)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent p-0 focus:ring-0">
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
                      ) : (
                        <PriorityBadge priority={t.priority} />
                      )}
                    </td>
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {can("update_status") ? (
                        <Select
                          value={t.status}
                          onValueChange={(v) =>
                            updateTask(t.id, { status: v as TaskStatus })
                          }
                          disabled={
                            me.role !== "admin" &&
                            me.role !== "o_level" &&
                            !t.assignees.includes(me.id)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-32 border-0 bg-transparent p-0 focus:ring-0">
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
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </td>
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {can("edit_task") && !isArchive && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditTask(t)}
                            disabled={
                              me.role !== "admin" &&
                              me.role !== "o_level" &&
                              !t.assignees.includes(me.id)
                            }
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {t.type === "private" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 cursor-pointer text-destructive"
                            onClick={() => handleDelete(t)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-7 w-7",
                              t.muted
                                ? "text-green-600"
                                : "text-muted-foreground",
                            )}
                            onClick={() => {
                              toggleMuteTask(t.id);
                              toast.success(
                                t.muted ? "Task unmuted" : "Task muted",
                              );
                            }}
                            disabled={
                              me.role !== "admin" &&
                              me.role !== "o_level" &&
                              !t.assignees.includes(me.id)
                            }
                          >
                            {t.muted ? (
                              <Volume2 className="h-3.5 w-3.5" />
                            ) : (
                              <VolumeX className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editTask && (
        <TaskModal open task={editTask} onClose={() => setEditTask(null)} />
      )}
      {detailTask && (
        <DetailModal
          open
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </>
  );
}
