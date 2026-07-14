import type {
  TaskPriority,
  TaskStatus,
  UserRole,
  ProjectStatus,
  PermissionsMap,
} from "@/types";

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; badgeClass: string }
> = {
  very_high: {
    label: "Very High",
    color: "#ff3b5c",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  high: {
    label: "High",
    color: "#ff8c42",
    badgeClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  medium: {
    label: "Medium",
    color: "#f5c518",
    badgeClass:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    label: "Low",
    color: "#4caf82",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; badgeClass: string }
> = {
  pending: {
    label: "Pending",
    color: "#8b8fa8",
    badgeClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  in_progress: {
    label: "In Progress",
    color: "#4f8ef7",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  done: {
    label: "Done",
    color: "#4caf82",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  blocked: {
    label: "Blocked",
    color: "#ff3b5c",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeClass: string; order: number }
> = {
  admin: {
    label: "Admin",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    order: 0,
  },
  o_level: {
    label: "O Level",
    badgeClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    order: 1,
  },
  manager: {
    label: "Manager",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    order: 2,
  },
  assistant_manager: {
    label: "Asst. Manager",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    order: 3,
  },
  executive: {
    label: "Executive",
    badgeClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    order: 4,
  },
};

export const ROLE_ORDER: UserRole[] = [
  "admin",
  "o_level",
  "manager",
  "assistant_manager",
  "executive",
];

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badgeClass: string }
> = {
  in_pipeline: {
    label: "In Pipeline",
    badgeClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  in_onboarding: {
    label: "In Onboarding",
    badgeClass:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  active: {
    label: "Active",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  done: {
    label: "Done",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  expired: {
    label: "Expired",
    badgeClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  canceled: {
    label: "Canceled",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export const PROJECT_COLORS = [
  "#4f8ef7",
  "#7c5ef7",
  "#4caf82",
  "#ff8c42",
  "#ff3b5c",
  "#f5c518",
  "#06b6d4",
  "#ec4899",
];

export const PERMISSION_LABELS: Record<string, string> = {
  create_task: "Create Tasks",
  edit_task: "Edit Tasks",
  update_status: "Update Status",
  create_account: "Create Accounts",
  view_reports: "View Reports",
  view_kpi: "View KPI Tracker",
  view_universal: "View Universal Tasks",
  view_daily_reports: "View Daily Reports",
  view_vault: "View Credentials Vault",
  manage_vault: "Manage Vault",
  manage_permissions: "Manage Permissions",
};

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  admin: {
    create_task: true,
    edit_task: true,
    update_status: true,
    create_account: true,
    view_reports: true,
    view_kpi: true,
    view_universal: true,
    view_daily_reports: true,
    view_vault: true,
    manage_vault: true,
    manage_permissions: true,
  },
  o_level: {
    create_task: true,
    edit_task: true,
    update_status: true,
    create_account: true,
    view_reports: true,
    view_kpi: true,
    view_universal: true,
    view_daily_reports: true,
    view_vault: true,
    manage_vault: true,
    manage_permissions: false,
  },
  manager: {
    create_task: true,
    edit_task: true,
    update_status: true,
    create_account: false,
    view_reports: true,
    view_kpi: true,
    view_universal: true,
    view_daily_reports: true,
    view_vault: true,
    manage_vault: false,
    manage_permissions: false,
  },
  assistant_manager: {
    create_task: true,
    edit_task: true,
    update_status: true,
    create_account: false,
    view_reports: true,
    view_kpi: false,
    view_universal: true,
    view_daily_reports: false,
    view_vault: false,
    manage_vault: false,
    manage_permissions: false,
  },
  executive: {
    create_task: false,
    edit_task: false,
    update_status: true,
    create_account: false,
    view_reports: false,
    view_kpi: false,
    view_universal: false,
    view_daily_reports: false,
    view_vault: false,
    manage_vault: false,
    manage_permissions: false,
  },
};
