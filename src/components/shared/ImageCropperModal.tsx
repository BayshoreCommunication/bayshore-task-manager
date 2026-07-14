"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ImageCropperModalProps {
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

export function ImageCropperModal({
  imageSrc,
  onCrop,
  onClose,
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const CANVAS_SIZE = 320;
  const CROP_RADIUS = 140;

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Auto-fit image to canvas
      const scale = Math.max(
        (CROP_RADIUS * 2) / img.width,
        (CROP_RADIUS * 2) / img.height,
      );
      setZoom(scale);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d")!;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    ctx.save();
    ctx.translate(cx + position.x, cy + position.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Dimming overlay outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Rule of thirds guides inside circle
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const third = (CROP_RADIUS * 2) / 3;
    for (let i = 1; i < 3; i++) {
      const offset = -CROP_RADIUS + third * i;
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - CROP_RADIUS);
      ctx.lineTo(cx + offset, cy + CROP_RADIUS);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - CROP_RADIUS, cy + offset);
      ctx.lineTo(cx + CROP_RADIUS, cy + offset);
      ctx.stroke();
    }
    ctx.restore();

    // Update preview
    updatePreview();
  }, [zoom, rotation, position, imageLoaded]);

  const updatePreview = useCallback(() => {
    const preview = previewCanvasRef.current;
    const img = imageRef.current;
    if (!preview || !img) return;

    const PREVIEW_SIZE = 72;
    const ctx = preview.getContext("2d")!;
    const scale = PREVIEW_SIZE / (CROP_RADIUS * 2);
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE / 2,
      0,
      Math.PI * 2,
    );
    ctx.clip();

    ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scale, zoom * scale);
    ctx.translate(position.x / zoom, position.y / zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [zoom, rotation, position]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const onMouseUp = () => setIsDragging(false);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Scroll to zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  const handleCrop = async () => {
    const img = imageRef.current;
    if (!img) return;
    setIsProcessing(true);

    const outputSize = 400;
    const offscreen = document.createElement("canvas");
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext("2d")!;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = outputSize / (CROP_RADIUS * 2);
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scale, zoom * scale);
    ctx.translate(position.x / zoom, position.y / zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    offscreen.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
        setIsProcessing(false);
      },
      "image/webp",
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Live preview */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-1 ring-offset-background shrink-0">
              <canvas
                ref={previewCanvasRef}
                width={72}
                height={72}
                className="w-full h-full"
              />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Crop Avatar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag to reposition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative flex items-center justify-center bg-muted/30 py-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl"
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
              maxWidth: "100%",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            onWheel={onWheel}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4 border-t border-border">
          {/* Zoom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Zoom
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <Slider
                min={30}
                max={500}
                step={1}
                value={[Math.round(zoom * 100)]}
                onValueChange={([v]) => setZoom(v / 100)}
                className="flex-1"
              />
              <button
                onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Rotate
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rotation}°
                </span>
                <button
                  onClick={() => setRotation(0)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  reset
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCw className="w-4 h-4 text-muted-foreground shrink-0" />
              <Slider
                min={-180}
                max={180}
                step={1}
                value={[rotation]}
                onValueChange={([v]) => setRotation(v)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={isProcessing || !imageLoaded}
              className="flex-1 gap-1.5"
              size="sm"
            >
              <Check className="w-3.5 h-3.5" />
              {isProcessing ? "Saving…" : "Apply"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
