"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge } from "@/components/shared/Badges";
import { useAppStore } from "@/store/useAppStore";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

export default function ProfilePage() {
  const { me, updateUser } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(me?.name ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [designation, setDesignation] = useState(me?.designation ?? "");
  const [department, setDepartment] = useState(me?.department ?? "");
  const [responsibilities, setResponsibilities] = useState(
    me?.responsibilities ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(me?.avatar ?? null);
  const [saving, setSaving] = useState(false);

  // Cropper state
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  if (!me) return null;

  const previewUser = { ...me, name, avatar };

  // Step 1: File selected → open cropper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";
    const url = URL.createObjectURL(file);
    setCropperSrc(url);
  };

  // Step 2: Cropper produces a Blob → upload it
  const handleCrop = async (blob: Blob) => {
    setCropperSrc(null);

    const formData = new FormData();
    formData.append("image", blob);

    await fetch("/api/uploads/image", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setAvatar(data.url);
        toast.success("Avatar updated!");
      })
      .catch((err) => {
        toast.error(err.message ?? "Upload failed");
      });
  };

  const save = async () => {
    setSaving(true);
    const updates: Record<string, string | null> = {
      name,
      email,
      designation,
      department,
      responsibilities,
      avatar,
    };
    if (newPassword) updates.password = newPassword;
    await updateUser(me.id, updates as any);
    toast.success("Profile saved!");
    setSaving(false);
    setNewPassword("");
  };

  return (
    <>
      {/* Image Cropper Modal */}
      {cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          onCrop={handleCrop}
          onClose={() => {
            setCropperSrc(null);
            URL.revokeObjectURL(cropperSrc);
          }}
        />
      )}

      <div className="max-w-md space-y-5 animate-fade-in">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="relative cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <UserAvatar user={previewUser} size="lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <div>
                <p className="font-black text-base">{name || me.name}</p>
                <RoleBadge role={me.role} />
                <p className="text-xs text-muted-foreground mt-1">
                  Click avatar to change photo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={me.role !== "admin" && me.role !== "o_level"}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={me.role !== "admin" && me.role !== "o_level"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. CEO"
                  disabled={me.role !== "admin" && me.role !== "o_level"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Management"
                  disabled={me.role !== "admin" && me.role !== "o_level"}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Responsibilities</Label>
              <Textarea
                rows={3}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="Describe your key responsibilities…"
                disabled={me.role !== "admin" && me.role !== "o_level"}
              />
            </div>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
