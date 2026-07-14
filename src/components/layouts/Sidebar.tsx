"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Lock,
  CalendarDays,
  FolderKanban,
  Columns3,
  BookOpen,
  TrendingUp,
  KeyRound,
  Users,
  ShieldCheck,
  Settings,
  UserCircle,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

// No permission needed — everyone sees these
const alwaysNav: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
];

// Gated individually below
const taskNav: NavItem[] = [
  { href: "/tasks", icon: CheckSquare, label: "Universal Tasks" },
  { href: "/my-tasks", icon: Lock, label: "My Tasks" },
  // { href: "/monthly", icon: CalendarDays, label: "Monthly Tasks" },
  { href: "/board", icon: Columns3, label: "My Board" },
];

const reportNav: NavItem[] = [
  { href: "/daily", icon: BookOpen, label: "Daily Reports" },
  { href: "/kpi", icon: TrendingUp, label: "KPI Tracker" },
  { href: "/vault", icon: KeyRound, label: "Credentials Vault" },
];

const adminNav: NavItem[] = [
  { href: "/users", icon: Users, label: "Users" },
  { href: "/permissions", icon: ShieldCheck, label: "Permissions" },
  { href: "/settings", icon: Settings, label: "App Settings" },
];

function NavLink({ href, icon: Icon, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  );
}

export function Sidebar() {
  const { me, brand, can, isElevated, logout, updateUser } = useAppStore();

  const isDark = me?.theme !== "light";
  const toggleTheme = async () => {
    if (!me) return;
    const next = isDark ? "light" : "dark";
    await updateUser(me.id, { theme: next });
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  if (!me) return null;

  // Derive visible task nav based on permissions
  const visibleTaskNav = taskNav.filter((item) => {
    switch (item.href) {
      case "/tasks":
        return can("view_universal"); // viewUniversal
      case "/my-tasks":
        return true; // everyone can see their own tasks
      case "/monthly":
        return true; // everyone
      case "/board":
        return true; // everyone
      default:
        return false;
    }
  });

  // Derive visible report nav based on permissions
  const visibleReportNav = reportNav.filter((item) => {
    switch (item.href) {
      case "/daily":
        return can("view_daily_reports"); // viewDailyReports
      case "/kpi":
        return can("view_kpi"); // viewKpi
      case "/vault":
        return can("view_vault") || can("manage_vault"); // viewVault | manageVault
      default:
        return false;
    }
  });

  const hasTaskSection = visibleTaskNav.length > 0;
  const hasReportSection = visibleReportNav.length > 0;
  const hasAdminSection =
    can("create_account") || can("manage_permissions") || me.role === "admin";

  return (
    <aside className="flex flex-col w-57.5 h-full bg-card border-r border-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
          {brand.logo ? (
            <img
              src={brand.logo}
              alt="logo"
              className="w-full h-full object-cover"
            />
          ) : (
            brand.name[0]
          )}
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">{brand.name}</p>
          <p className="text-[10px] text-muted-foreground">Workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <SectionLabel>Main</SectionLabel>
        {alwaysNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {hasTaskSection && (
          <>
            <SectionLabel>Tasks</SectionLabel>
            {visibleTaskNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}

        {hasReportSection && (
          <>
            <SectionLabel>Reports</SectionLabel>
            {visibleReportNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}

        {hasAdminSection && (
          <>
            <SectionLabel>Admin</SectionLabel>
            {can("create_account") && <NavLink {...adminNav[0]} />}
            {can("manage_permissions") && <NavLink {...adminNav[1]} />}
            {me.role === "admin" && <NavLink {...adminNav[2]} />}
          </>
        )}

        <SectionLabel>Account</SectionLabel>
        <NavLink href="/profile" icon={UserCircle} label="My Profile" />
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center cursor-pointer gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex items-center cursor-pointer gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
