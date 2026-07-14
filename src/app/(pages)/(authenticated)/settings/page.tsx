"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsPage() {
  const { me, brand, updateBrand } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(brand.name);
  const [logo, setLogo] = useState<string | null>(brand.logo);
  const [saving, setSaving] = useState(false);

  if (me?.role !== "admin") {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-2xl mb-3">🔒</p>
        <p className="font-semibold">Admin only</p>
        <p className="text-sm mt-1">
          This page is restricted to the Admin account.
        </p>
      </div>
    );
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    await updateBrand({ name, logo });
    toast.success("Settings saved!");
    setSaving(false);
  };

  return (
    <div className="max-w-md space-y-5 animate-fade-in">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Brand &amp; App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>App Logo</Label>
            <div className="flex items-center gap-3 mt-1">
              <div
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors"
                onClick={() => fileRef.current?.click()}
                style={{
                  background: logo
                    ? undefined
                    : "linear-gradient(135deg, #4f8ef7, #7c5ef7)",
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt="logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-xl">
                    {name[0] ?? "B"}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Logo
                </Button>
                {logo && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive ml-2"
                    onClick={() => setLogo(null)}
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, SVG — shown in sidebar & login
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogo}
              />
            </div>
          </div>

          {/* App name */}
          <div className="space-y-1.5">
            <Label>App Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="BayshoreOS"
            />
          </div>

          {/* Preview */}
          <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{
                background: logo
                  ? undefined
                  : "linear-gradient(135deg, #4f8ef7, #7c5ef7)",
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-base">
                  {name[0] ?? "B"}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{name || "App Name"}</p>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              Preview
            </span>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
