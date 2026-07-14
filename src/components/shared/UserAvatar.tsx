"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserAvatarProps {
  user: User | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getGradient(name: string): string {
  const hue = ((name?.charCodeAt(0) ?? 65) * 19) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,52%), hsl(${(hue + 60) % 360},55%,42%))`;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const name = user?.name ?? "?";
  return (
    <Avatar className={cn(sizeMap[size], "shrink-0", className)}>
      {user?.avatar && <AvatarImage src={user.avatar} alt={name} />}
      <AvatarFallback
        className="font-bold text-white"
        style={{ background: getGradient(name) }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

interface AvatarStackProps {
  userIds: string[];
  users: User[];
  max?: number;
  size?: "xs" | "sm";
}

export function AvatarStack({
  userIds,
  users,
  max = 3,
  size = "sm",
}: AvatarStackProps) {
  const shown = userIds.slice(0, max);
  const rest = userIds.length - max;
  return (
    <div className="flex -space-x-1">
      {shown.map((id) => {
        const u = users.find((x) => x.id === id);
        return (
          <UserAvatar
            key={id}
            user={u}
            size={size}
            className="ring-2 ring-background"
          />
        );
      })}
      {rest > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full ring-2 ring-background bg-muted text-muted-foreground font-bold",
            size === "xs" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[9px]",
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
