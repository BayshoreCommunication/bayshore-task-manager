"use client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import { ROLE_ORDER, ROLE_CONFIG, PERMISSION_LABELS } from "@/lib/constants";
import type { UserRole, PermissionKey } from "@/types";

const PERMISSION_KEYS: PermissionKey[] = [
  "create_task",
  "edit_task",
  "update_status",
  "create_account",
  "view_reports",
  "view_kpi",
  "view_universal",
  "view_daily_reports",
  "view_vault",
  "manage_vault",
  "manage_permissions",
];

export default function PermissionsPage() {
  const { permissions, togglePermission, can } = useAppStore();

  const handleToggle = async (role: UserRole, key: PermissionKey) => {
    if (role === "admin") return;
    if (!can("manage_permissions")) {
      toast.error("No permission to change this");
      return;
    }
    await togglePermission(role, key);
    toast.success("Permission updated");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Toggle permissions per role. Admin permissions are locked. Changes take
        effect immediately.
      </p>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-52">
                  Permission
                </th>
                {ROLE_ORDER.map((role) => (
                  <th
                    key={role}
                    className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                  >
                    {ROLE_CONFIG[role].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSION_KEYS.map((key) => (
                <tr key={key} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">
                    {PERMISSION_LABELS[key]}
                  </td>
                  {ROLE_ORDER.map((role) => {
                    const enabled = !!permissions[role]?.[key];
                    const locked = role === "admin";
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={enabled}
                            disabled={locked}
                            onCheckedChange={() => handleToggle(role, key)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        * Vault access is managed per-credential entry inside the Credentials
        Vault — not here.
      </p>
    </div>
  );
}
