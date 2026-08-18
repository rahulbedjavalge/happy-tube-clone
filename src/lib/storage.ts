import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MEDIA_PREFIX = "media://";
export const MAX_DURATION_SECONDS = 600;
export const SHORT_MAX_SECONDS = 60;
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isMediaRef(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith(MEDIA_PREFIX));
}

export function mediaPath(url: string) {
  return url.slice(MEDIA_PREFIX.length);
}

export async function resolveMediaUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!isMediaRef(url)) return url;
  const { data, error } = await supabase.storage.from("media").createSignedUrl(mediaPath(url), SIGNED_URL_TTL);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

/** Resolves storage refs to short-lived signed URLs; plain URLs pass through. */
export function useMediaUrl(url: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["media-url", url],
    queryFn: () => resolveMediaUrl(url),
    enabled: Boolean(url),
    staleTime: (SIGNED_URL_TTL - 300) * 1000,
  });
  if (!url) return null;
  return isMediaRef(url) ? (data ?? null) : url;
}

function extensionOf(file: File) {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()! : "";
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] ?? "bin";
}

export async function uploadMedia(userId: string, file: File, folder: string): Promise<string> {
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extensionOf(file)}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return `${MEDIA_PREFIX}${path}`;
}

export type VideoProbe = { duration: number; width: number; height: number };

export function probeVideoFile(file: File): Promise<VideoProbe> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const probe = { duration: el.duration, width: el.videoWidth, height: el.videoHeight };
      URL.revokeObjectURL(objectUrl);
      if (!Number.isFinite(probe.duration)) reject(new Error("Could not read the video length"));
      else resolve(probe);
    };
    el.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That file could not be read as a video"));
    };
    el.src = objectUrl;
  });
}

/** Grabs a frame ~1s in and returns it as a JPEG file for use as a thumbnail. */
export function captureThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    el.preload = "metadata";
    el.muted = true;
    el.playsInline = true;
    const fail = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    el.onloadeddata = () => {
      el.currentTime = Math.min(1, Math.max(0, (el.duration || 1) / 2));
    };
    el.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = el.videoWidth;
        canvas.height = el.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail();
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            resolve(blob ? new File([blob], "thumbnail.jpg", { type: "image/jpeg" }) : null);
          },
          "image/jpeg",
          0.85,
        );
      } catch {
        fail();
      }
    };
    el.onerror = fail;
    el.src = objectUrl;
  });
}
