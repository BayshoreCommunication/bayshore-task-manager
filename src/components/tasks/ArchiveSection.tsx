"use client";

import { useState } from "react";
import { ChevronDown, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskTable } from "@/components/tasks/TaskTable";
import type { Task } from "@/types";

interface ArchiveSectionProps {
  title: string;
  tasks: Task[];
  showAssignee?: boolean;
}

export function ArchiveSection({
  title,
  tasks,
  showAssignee,
}: ArchiveSectionProps) {
  const [open, setOpen] = useState(false);
  if (!tasks.length) return null;
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-muted-foreground"
      >
        <Archive className="h-4 w-4" />
        <span className="flex-1 text-left">
          {title} ({tasks.length})
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-2">
          <TaskTable tasks={tasks} showAssignee={showAssignee} isArchive />
        </div>
      )}
    </div>
  );
}
