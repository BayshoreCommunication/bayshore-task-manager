"use client";

import { useAppStore } from "@/store/useAppStore";
import type { PermissionKey } from "@/types";

/**
 * Returns convenience permission helpers for use in components.
 * Mirrors the can() and isElevated() methods on the store.
 */
export function usePermissions() {
  const can = useAppStore((s) => s.can);
  const isElevated = useAppStore((s) => s.isElevated);
  const me = useAppStore((s) => s.me);

  return {
    can,
    isElevated,
    me,
    isAdmin: me?.role === "admin",
    isOLevel: me?.role === "o_level",
  };
}
