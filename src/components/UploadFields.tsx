import { useRef, useState } from "react";
import { Loader2, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/lib/format";
import {
  IMAGE_TYPES,
  MAX_DURATION_SECONDS,
  SHORT_MAX_SECONDS,
  VIDEO_TYPES,
  captureThumbnail,
  probeVideoFile,
  uploadMedia,
} from "@/lib/storage";

export type UploadResult = {
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  is_short: boolean;
};

export function VideoUploadField({
  userId,
  onUploaded,
  currentUrl,
}: {
  userId: string;
  onUploaded: (result: UploadResult) => void;
  currentUrl: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error("Please choose an MP4, WebM or MOV file");
      return;
    }
    setBusy(true);
    try {
      setStatus("Reading video…");
      const probe = await probeVideoFile(file);
      const duration = Math.round(probe.duration);
      if (duration > MAX_DURATION_SECONDS) {
        toast.error(`Videos can be at most 10 minutes. This one is ${formatDuration(duration)}.`);
        return;
      }
      const isShort = duration <= SHORT_MAX_SECONDS && probe.height >= probe.width;

      setStatus("Uploading video…");
      const videoRef = await uploadMedia(userId, file, "videos");

      setStatus("Creating thumbnail…");
      let thumb: string | null = null;
      const frame = await captureThumbnail(file);
      if (frame) {
        try {
          thumb = await uploadMedia(userId, frame, "thumbnails");
        } catch {
          thumb = null;
        }
      }

      onUploaded({
        video_url: videoRef,
        thumbnail_url: thumb,
        duration_seconds: duration,
        is_short: isShort,
      });
      toast.success(isShort ? "Short uploaded — details below" : "Video uploaded — details below");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setStatus(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <Label>Upload a video file (max 10 minutes)</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        MP4, WebM or MOV. Vertical clips under 60 seconds become Shorts automatically.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadIcon className="mr-2 size-4" />}
          {busy ? (status ?? "Working…") : "Choose file"}
        </Button>
        {currentUrl ? <span className="text-xs text-muted-foreground">File attached</span> : null}
      </div>
    </div>
  );
}

export function ImageUploadField({
  userId,
  label,
  value,
  onUploaded,
}: {
  userId: string;
  label: string;
  value: string | null;
  onUploaded: (ref: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image");
      return;
    }
    setBusy(true);
    try {
      const ref = await uploadMedia(userId, file, "images");
      onUploaded(ref);
      toast.success(`${label} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="mt-1.5 flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadIcon className="mr-2 size-4" />}
          Upload
        </Button>
        <Input readOnly value={value ?? ""} placeholder="No image yet" className="h-9 text-xs" />
      </div>
    </div>
  );
}
