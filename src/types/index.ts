// ─── Role & Permission Types ─────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "o_level"
  | "manager"
  | "assistant_manager"
  | "executive";

export type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
export type TaskPriority = "very_high" | "high" | "medium" | "low";
export type TaskType = "universal" | "private";

export type ProjectStatus =
  | "in_pipeline"
  | "in_onboarding"
  | "active"
  | "done"
  | "expired"
  | "canceled";

export type AttachmentType = "link" | "image" | "pdf";
export type LogEntryType =
  | "task_created"
  | "task_edited"
  | "task_status"
  | "task_priority"
  | "task_due"
  | "task_muted"
  | "task_unmuted"
  | "comment"
  | "user_created"
  | "user_edited"
  | "user_muted"
  | "user_unmuted"
  | "report"
  | "report_edited"
  | "login"
  | "settings"
  | "vault_created"
  | "vault_edited"
  | "vault_deleted";

// ─── Core Models ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  designation: string;
  department: string;
  responsibilities: string;
  avatar: string | null;
  muted: boolean;
  sessionVersion: number;
  theme?: "dark" | "light";
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  attachments: CommentAttachment[];
  at: string;
}

export interface CommentAttachment {
  type: "link";
  url: string;
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  url?: string; // for link type
  data?: string; // base64 for image/pdf
  addedBy: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  details: string;
  assignees: string[];
  createdBy: string;
  createdAt: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  projectId: string | null;
  muted: boolean;
  completedAt: string | null;
  comments: Comment[];
  attachments: Attachment[];
}

export interface MonthlyCompletion {
  userId: string;
  month: string; // "YYYY-MM"
  at: string;
}

export interface MonthlyTask {
  id: string;
  title: string;
  details: string;
  dueDay: number;
  priority: TaskPriority;
  assignees: string[]; // empty = everyone
  muted: boolean;
  createdBy: string;
  createdAt: string;
  completions: MonthlyCompletion[];
}

export interface ProjectDoc {
  id: string;
  name: string;
  type: AttachmentType;
  url?: string;
  data?: string;
  addedBy: string;
  at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
  members: string[];
  docs: ProjectDoc[];
  createdBy: string;
  createdAt: string;
}

export interface VaultEntry {
  id: string;
  client: string;
  platform: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  accessList: string[]; // user ids; empty = admin+o_level only
  createdAt: string;
  createdBy: string;
}
export type HourEntry = {
  hour: number;
  note: string;
};

export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  content: string;
  plan: string;
  blockers: string;
  hours: HourEntry[];
  at: string;
}

export interface Notification {
  id: string;
  message: string;
  linkPage?: string;
  targetUserId: string;
  read: boolean;
  createdAt: string; // was `at`
}

export interface LogEntry {
  id: string;
  type: LogEntryType;
  message: string;
  details: string;
  actorId: string;
  at: string;
  ico: string;
  taskId?: string;
  vaultId?: string;
}

export interface Brand {
  name: string;
  logo: string | null;
}

// ─── Permission Types ─────────────────────────────────────────────────────────

export interface RolePermissions {
  create_task: boolean;
  edit_task: boolean;
  update_status: boolean;
  create_account: boolean;
  view_reports: boolean;
  view_kpi: boolean;
  view_universal: boolean;
  view_daily_reports: boolean;
  view_vault: boolean;
  manage_vault: boolean;
  manage_permissions: boolean;
}

export type PermissionKey = keyof RolePermissions;
export type PermissionsMap = Record<UserRole, RolePermissions>;

// ─── Store / App State ────────────────────────────────────────────────────────

export interface AppState {
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
  me: User | null;
  hydrated: boolean;
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KPIResult {
  cr: number; // completion rate
  ot: number; // on-time rate
  rs: number; // report score
  od: number; // no-overdue score
  mr: number; // monthly task rate
  ov: number; // overall weighted score
  done: number;
  total: number;
  overdue: number;
  reports: number;
  mDone: number;
  mTotal: number;
}
