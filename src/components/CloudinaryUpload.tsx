"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  loading?: boolean;
}

export function CloudinaryUpload({
  onUploadSuccess,
  folder = "employee_profiles",
  loading,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      onUploadSuccess(data.url);
      // Reset the input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={uploading || loading}
        onClick={handleButtonClick}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading || loading}
        className="hidden"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
