"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useHydration() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}
