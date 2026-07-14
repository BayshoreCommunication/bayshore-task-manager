"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardCard } from "@/components/tasks/BoardCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { STATUS_CONFIG } from "@/lib/constants";
import type { TaskStatus } from "@/types";

const COLS: TaskStatus[] = ["pending", "in_progress", "done", "blocked"];

export default function BoardPage() {
  const { me, tasks, can } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  if (!me) return null;

  const myTasks = tasks.filter((t) => !t.muted && t.assignees.includes(me.id));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing only tasks assigned to you
        </p>
        {can("create_task") && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-3.5 w-3.5" />
            Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLS.map((col) => {
          const colTasks = myTasks.filter((t) => t.status === col);
          const cfg = STATUS_CONFIG[col];
          return (
            <div
              key={col}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: cfg.color }}
                />
                <span className="font-bold text-sm">{cfg.label}</span>
                <span className="ml-auto w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
              {colTasks.map((t) => (
                <BoardCard key={t.id} task={t} />
              ))}
            </div>
          );
        })}
      </div>

      {showModal && (
        <TaskModal
          open
          defaults={{ type: "universal", assignees: [me.id] }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
