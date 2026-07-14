"use client";
import { create } from "zustand";
import { signIn, signOut, getSession } from "next-auth/react";
import { chime } from "@/lib/utils";
import type {
  User,
  Task,
  Notification,
  DailyReport,
  PermissionsMap,
  PermissionKey,
  Brand,
  VaultEntry,
  MonthlyTask,
  Project,
  LogEntry,
  LogEntryType,
  AppState,
  UserRole,
} from "@/types/index";

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function api<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppStore extends AppState {
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Users
  setUsers: (users: User[]) => void;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  createUser: (
    data: Omit<User, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  toggleMuteUser: (id: string) => Promise<void>;

  // Tasks
  setTasks: (tasks: Task[]) => void;
  createTask: (
    data: Omit<
      Task,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "completedAt"
      | "comments"
      | "attachments"
    >,
  ) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  toggleMuteTask: (id: string) => Promise<void>;

  // Notifications
  pushNotification: (
    notif: Omit<Notification, "id" | "createdAt" | "read">,
  ) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  // Daily reports
  createDailyReport: (
    data: Omit<DailyReport, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateDailyReport: (id: string, data: Partial<DailyReport>) => Promise<void>;

  // Permissions
  togglePermission: (role: UserRole, key: PermissionKey) => Promise<void>;

  // Brand / app settings
  updateBrand: (data: Partial<Brand>) => Promise<void>;

  // Vault
  setVault: (vault: VaultEntry[]) => void;
  createVaultEntry: (
    data: Omit<VaultEntry, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  updateVaultEntry: (id: string, data: Partial<VaultEntry>) => Promise<void>;
  deleteVaultEntry: (id: string) => Promise<void>;

  // Monthly tasks
  setMonthly: (monthly: MonthlyTask[]) => void;
  createMonthlyTask: (
    data: Omit<MonthlyTask, "id" | "createdAt" | "updatedAt" | "completions">,
  ) => Promise<void>;
  updateMonthlyTask: (id: string, data: Partial<MonthlyTask>) => Promise<void>;
  toggleMonthlyComplete: (
    taskId: string,
    userId: string,
    month: string,
  ) => Promise<void>;

  // Projects
  setProjects: (projects: Project[]) => void;
  createProject: (
    data: Omit<Project, "id" | "createdAt" | "updatedAt" | "docs">,
  ) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  toggleProjectMember: (projectId: string, userId: string) => Promise<void>;

  // Activity log
  addLog: (
    type: LogEntryType,
    message: string,
    details?: string,
    actorId?: string,
    extra?: Partial<LogEntry>,
  ) => Promise<void>;

  // Permission helpers
  can: (perm: PermissionKey) => boolean;
  isElevated: () => boolean;

  // Bootstrap — called once on app mount
  hydrate: () => Promise<void>;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Initial state ───────────────────────────────────────────────────────────
  users: [],
  tasks: [],
  notifications: [],
  dailyReports: [],
  permissions: {} as PermissionsMap,
  brand: {} as Brand,
  vault: [],
  monthly: [],
  projects: [],
  log: [],
  me: null,
  hydrated: false,

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  //
  // Pulls the authenticated user from NextAuth's session, then fetches all
  // bootstrap data from a single /api/bootstrap endpoint (one round-trip).
  // The server route runs the Prisma queries and returns everything the client
  // needs to initialise.

  hydrate: async () => {
    // 1. Get NextAuth session (works in both RSC and client components)
    try {
      const data = await api<{
        me: User | null;
        users: User[];
        tasks: Task[];
        notifications: Notification[];
        dailyReports: DailyReport[];
        permissions: PermissionsMap;
        brand: Brand;
        vault: VaultEntry[];
        monthly: MonthlyTask[];
        projects: Project[];
        log: LogEntry[];
      }>("/api/bootstrap");
      set({ ...data });
    } catch (e) {
      console.error("Hydration failed:", e);
    } finally {
      set({ hydrated: true }); // ✅ always runs
    }
  },

  // ── Auth ────────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    // NextAuth CredentialsProvider — server validates bcrypt hash via Prisma
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    console.log("Login result:", result);

    if (result?.error || !result?.ok) return false;

    // Re-hydrate so `me` and all data reflect the new session
    await get().hydrate();

    const me = get().me;
    console.log("Logged in as:", me);
    if (me) {
      await get().addLog("login", `${me.name} signed in`, "", me.id, {
        ico: "🔑",
      });
    }

    return true;
  },

  logout: async () => {
    const { me, addLog } = get();
    if (me)
      await addLog("login", `${me.name} signed out`, "", me.id, { ico: "🔑" });

    await signOut({ redirect: false });

    // Clear client state
    set({
      me: null,
      users: [],
      tasks: [],
      notifications: [],
      dailyReports: [],
      vault: [],
      monthly: [],
      projects: [],
      log: [],
      hydrated: false,
    });
  },

  // ── Users ───────────────────────────────────────────────────────────────────

  setUsers: (users) => set({ users }),

  createUser: async (data) => {
    const { addLog, me } = get();
    const user = await api<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ users: [...s.users, user] }));
    await addLog("user_created", `${user.name} account created`, "", me?.id, {
      ico: "👤",
    });
  },

  updateUser: async (id, data) => {
    const { users, me } = get();

    // Optimistic update
    const prev = users;
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
      me: s.me?.id === id ? { ...s.me!, ...data } : s.me,
    }));

    try {
      await api(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await get().addLog("user_edited", `User profile updated`, "", me?.id, {
        ico: "✏️",
      });
    } catch (err) {
      // Roll back
      set({ users: prev, me: me });
      throw err;
    }
  },

  toggleMuteUser: async (id) => {
    const { users, me, addLog } = get();
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const muted = !user.muted;

    // Optimistic update
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, muted } : u)),
    }));

    try {
      await api(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ muted }),
      });
      const action = muted ? "muted" : "unmuted";
      await addLog(
        muted ? "user_muted" : "user_unmuted",
        `${user.name} was ${action}`,
        "",
        me?.id,
        { ico: muted ? "🔇" : "🔊" },
      );
    } catch (err) {
      set({ users });
      throw err;
    }
  },

  // ── Tasks ───────────────────────────────────────────────────────────────────

  setTasks: (tasks) => set({ tasks }),

  createTask: async (data) => {
    const { addLog, me } = get();
    const task = await api<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ tasks: [task, ...s.tasks] }));
    await addLog("task_created", `Task created: "${task.title}"`, "", me?.id, {
      ico: "✅",
      taskId: task.id,
    });
  },

  updateTask: async (id, data) => {
    const { tasks, me, pushNotification, addLog } = get();
    const original = tasks.find((t) => t.id === id);
    if (!original) return;

    const completing = data.status === "done" && original.status !== "done";

    // Optimistic update
    const prev = tasks;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...data,
              completedAt: completing
                ? new Date().toISOString()
                : t.completedAt,
            }
          : t,
      ),
    }));

    try {
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (data.status) {
        await addLog(
          "task_status",
          `"${original.title}" status → ${data.status}`,
          "",
          me?.id,
          {
            ico: "🔄",
            taskId: id,
          },
        );
        // Notify all assignees except the actor
        for (const assignee of original.assignees ?? []) {
          const aid =
            typeof assignee === "string" ? assignee : (assignee as any).userId;
          if (aid !== me?.id) {
            await pushNotification({
              targetUserId: aid,
              message: `"${original.title}" → ${data.status}`,
              linkPage: "/tasks",
            });
          }
        }
      }
      if (data.priority)
        await addLog(
          "task_priority",
          `"${original.title}" priority → ${data.priority}`,
          "",
          me?.id,
          {
            ico: "⬆️",
            taskId: id,
          },
        );
      if (data.dueDate)
        await addLog(
          "task_due",
          `"${original.title}" due → ${data.dueDate}`,
          "",
          me?.id,
          {
            ico: "📅",
            taskId: id,
          },
        );
    } catch (err) {
      set({ tasks: prev });
      throw err;
    }
  },

  toggleMuteTask: async (id) => {
    const { tasks, me, addLog } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const muted = !task.muted;
    const prev = tasks;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, muted } : t)),
    }));

    try {
      await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ muted }),
      });
      await addLog(
        muted ? "task_muted" : "task_unmuted",
        `"${task.title}" was ${muted ? "muted" : "unmuted"}`,
        "",
        me?.id,
        {
          ico: muted ? "🔇" : "🔊",
          taskId: id,
        },
      );
    } catch (err) {
      set({ tasks: prev });
      throw err;
    }
  },

  // ── Notifications ────────────────────────────────────────────────────────────

  pushNotification: async (data) => {
    chime();
    const notif = await api<Notification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ notifications: [notif, ...s.notifications] }));
  },

  markNotificationRead: async (id) => {
    await api(`/api/notifications/${id}`, { method: "PATCH" });
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  markAllRead: async () => {
    const prev = get().notifications;

    // Optimistic
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));

    try {
      await api("/api/notifications/read-all", { method: "POST" });
    } catch (err) {
      set({ notifications: prev });
      throw err;
    }
  },

  // ── Daily reports ────────────────────────────────────────────────────────────

  createDailyReport: async (data) => {
    const { addLog, me } = get();
    const report = await api<DailyReport>("/api/daily-reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ dailyReports: [report, ...s.dailyReports] }));
    await addLog(
      "report",
      `${me?.name} submitted daily report`,
      (data.content as string).slice(0, 60),
      me?.id,
      {
        ico: "📋",
      },
    );
  },

  updateDailyReport: async (id, data) => {
    const { dailyReports, me, addLog } = get();
    const prev = dailyReports;

    set((s) => ({
      dailyReports: s.dailyReports.map((r) =>
        r.id === id ? { ...r, ...data } : r,
      ),
    }));

    try {
      await api(`/api/daily-reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await addLog(
        "report_edited",
        `${me?.name} edited daily report`,
        "",
        me?.id,
        { ico: "✏️" },
      );
    } catch (err) {
      set({ dailyReports: prev });
      throw err;
    }
  },

  // ── Permissions ──────────────────────────────────────────────────────────────

  togglePermission: async (role, key) => {
    if (role === "admin") return; // admin is always fully elevated — never touch it

    const { permissions } = get();
    const prev = permissions;
    const updated = {
      ...permissions,
      [role]: { ...permissions[role], [key]: !permissions[role]?.[key] },
    };

    set({ permissions: updated });

    try {
      await api(`/api/permissions/${role}`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: updated[role][key] }),
      });
    } catch (err) {
      set({ permissions: prev });
      throw err;
    }
  },

  // ── Brand / app settings ─────────────────────────────────────────────────────

  updateBrand: async (data) => {
    const { brand, addLog, me } = get();
    const prev = brand;
    const updated = { ...brand, ...data };

    set({ brand: updated });

    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await addLog(
        "settings",
        `App settings updated — ${updated.name}`,
        "",
        me?.id,
        { ico: "⚙️" },
      );
    } catch (err) {
      set({ brand: prev });
      throw err;
    }
  },

  // ── Vault ────────────────────────────────────────────────────────────────────

  setVault: (vault) => set({ vault }),

  createVaultEntry: async (data) => {
    const { addLog, me } = get();
    const entry = await api<VaultEntry>("/api/vault", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ vault: [...s.vault, entry] }));
    await addLog(
      "vault_created",
      `New credential: ${entry.client} / ${entry.platform}`,
      "",
      me?.id,
      {
        ico: "🔐",
        vaultId: entry.id,
      },
    );
  },

  updateVaultEntry: async (id, data) => {
    const { vault, me, addLog } = get();
    const prev = vault;

    set((s) => ({
      vault: s.vault.map((v) => (v.id === id ? { ...v, ...data } : v)),
    }));

    try {
      await api(`/api/vault/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await addLog("vault_edited", `Credential updated`, "", me?.id, {
        ico: "🔐",
        vaultId: id,
      });
    } catch (err) {
      set({ vault: prev });
      throw err;
    }
  },

  deleteVaultEntry: async (id) => {
    const { vault, me, addLog } = get();
    const entry = vault.find((v) => v.id === id);
    const prev = vault;

    set((s) => ({ vault: s.vault.filter((v) => v.id !== id) }));

    try {
      await api(`/api/vault/${id}`, { method: "DELETE" });
      if (entry)
        await addLog(
          "vault_deleted",
          `Credential deleted: ${entry.client} / ${entry.platform}`,
          "",
          me?.id,
          {
            ico: "🗑️",
            vaultId: id,
          },
        );
    } catch (err) {
      set({ vault: prev });
      throw err;
    }
  },

  // ── Monthly tasks ─────────────────────────────────────────────────────────────

  setMonthly: (monthly) => set({ monthly }),

  createMonthlyTask: async (data) => {
    const { addLog, me } = get();
    const task = await api<MonthlyTask>("/api/monthly", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ monthly: [...s.monthly, task] }));
    await addLog(
      "task_created",
      `Monthly task created: ${task.title}`,
      "",
      me?.id,
      { ico: "✅" },
    );
  },

  updateMonthlyTask: async (id, data) => {
    const { monthly, me, addLog } = get();
    const prev = monthly;

    set((s) => ({
      monthly: s.monthly.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));

    try {
      await api(`/api/monthly/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await addLog("task_edited", `Monthly task updated`, "", me?.id, {
        ico: "✏️",
      });
    } catch (err) {
      set({ monthly: prev });
      throw err;
    }
  },

  toggleMonthlyComplete: async (taskId, userId, month) => {
    const { monthly, addLog } = get();
    const task = monthly.find((m) => m.id === taskId);
    if (!task) return;

    const isDone = task.completions?.some(
      (c) => c.userId === userId && c.month === month,
    );
    const prev = monthly;

    // Optimistic
    const newCompletion = isDone
      ? (task.completions ?? []).filter(
          (c) => !(c.userId === userId && c.month === month),
        )
      : [
          ...(task.completions ?? []),
          { userId, month, at: new Date().toISOString() },
        ];

    set((s) => ({
      monthly: s.monthly.map((m) =>
        m.id === taskId ? { ...m, completions: newCompletion } : m,
      ),
    }));

    try {
      await api(`/api/monthly/${taskId}/complete`, {
        method: "POST",
        body: JSON.stringify({ userId, month }),
      });
      await addLog(
        "task_status",
        `"${task.title}" monthly ${isDone ? "unmarked" : "completed"}`,
        "",
        userId,
        { ico: "🔄" },
      );
    } catch (err) {
      set({ monthly: prev });
      throw err;
    }
  },

  // ── Projects ──────────────────────────────────────────────────────────────────

  setProjects: (projects) => set({ projects }),

  createProject: async (data) => {
    const { addLog, me } = get();
    const project = await api<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ projects: [...s.projects, project] }));
    await addLog(
      "task_created",
      `Project created: ${project.name}`,
      "",
      me?.id,
      { ico: "📁" },
    );
  },

  updateProject: async (id, data) => {
    const { projects, me, addLog } = get();
    const prev = projects;

    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));

    try {
      await api(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await addLog("task_edited", `Project updated`, "", me?.id, { ico: "✏️" });
    } catch (err) {
      set({ projects: prev });
      throw err;
    }
  },

  toggleProjectMember: async (projectId, userId) => {
    const { projects, me, addLog, users } = get();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const isMember = project.members?.some((m) =>
      typeof m === "string" ? m === userId : (m as any).userId === userId,
    );
    const prev = projects;

    // Optimistic
    const newMembers = isMember
      ? (project.members ?? []).filter((m) =>
          typeof m === "string" ? m !== userId : (m as any).userId !== userId,
        )
      : [...(project.members ?? []), userId];

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, members: newMembers } : p,
      ),
    }));

    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const user = users.find((u) => u.id === userId);
      await addLog(
        "task_edited",
        `${isMember ? "Removed" : "Added"} ${user?.name} ${isMember ? "from" : "to"} ${project.name}`,
        "",
        me?.id,
        { ico: "👥" },
      );
    } catch (err) {
      set({ projects: prev });
      throw err;
    }
  },

  // ── Activity log ──────────────────────────────────────────────────────────────

  addLog: async (type, message, details = "", actorId, extra = {}) => {
    const { me } = get();
    const payload = {
      type,
      message,
      details,
      actorId: actorId ?? me?.id ?? null,
      ico: "📌",
      ...extra,
    };

    // Fire-and-forget (log failures shouldn't crash the UI action)
    api<LogEntry>("/api/log", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((entry) => {
        set((s) => ({ log: [entry, ...s.log].slice(0, 1000) }));
      })
      .catch(console.error);
  },

  // ── Permission helpers ────────────────────────────────────────────────────────

  can: (perm) => {
    const { permissions, me } = get();
    if (!me) return false;
    return !!permissions[me.role]?.[perm];
  },

  isElevated: () => {
    const { me } = get();
    return me?.role === "admin" || me?.role === "o_level";
  },
}));
