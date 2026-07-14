"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAppStore } from "@/store/useAppStore";
import { fmtTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Universal Tasks",
  "/my-tasks": "My Tasks",
  "/monthly": "Monthly Tasks",
  "/projects": "Projects",
  "/board": "My Board",
  "/daily": "Daily Reports",
  "/kpi": "KPI Tracker",
  "/vault": "Credentials Vault",
  "/users": "Users",
  "/permissions": "Permissions",
  "/profile": "My Profile",
  "/settings": "App Settings",
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, notifications, markAllRead, can, markNotificationRead, logout } =
    useAppStore();
  const [notifsOpen, setNotifsOpen] = useState(false);

  const myNotifs = notifications.filter((n) => n.targetUserId === me?.id);
  const unread = myNotifs.filter((n) => !n.read).length;

  const title = PAGE_TITLES[pathname] ?? "BayshoreOS";

  const handleOpenNotifs = () => {
    setNotifsOpen((o) => !o);
    if (!notifsOpen) markAllRead();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-bold text-sm flex-1">{title}</h1>

      {/* Notifications */}
      {/* <DropdownMenu open={notifsOpen} onOpenChange={setNotifsOpen}>
        <DropdownMenuTrigger
          onClick={handleOpenNotifs}
          className="relative cursor-pointer p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 max-h-96 overflow-y-auto"
        >
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {myNotifs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              All caught up!
            </div>
          ) : (
            myNotifs.slice(0, 15).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex flex-col items-start gap-0.5 py-2.5 cursor-pointer",
                  !n.read && "bg-primary/5",
                )}
                onClick={() => {
                  if (n.linkPage) router.push(n.linkPage);
                  markNotificationRead(n.id);
                  setNotifsOpen(false);
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                  <span className="text-sm leading-tight">{n.message}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-3.5">
                  {fmtTime(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu> */}

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors cursor-pointer">
            <UserAvatar user={me!} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-none">
                {me?.name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {me?.designation}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className="cursor-pointer"
          >
            My Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
