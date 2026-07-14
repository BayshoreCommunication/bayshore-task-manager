"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  ROLE_CONFIG,
  PROJECT_STATUS_CONFIG,
} from "@/lib/constants";
import type {
  TaskPriority,
  TaskStatus,
  UserRole,
  ProjectStatus,
} from "@/types";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        cfg.badgeClass,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        cfg.badgeClass,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        cfg.badgeClass,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = PROJECT_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        cfg.badgeClass,
      )}
    >
      {cfg.label}
    </span>
  );
}
