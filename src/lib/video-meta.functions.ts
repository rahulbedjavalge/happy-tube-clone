import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicVideoMeta = {
  id: string;
  title: string;
  description: string | null;
  channel: string | null;
  isShort: boolean;
  /** Absolute https URL usable by social crawlers, or null when unavailable. */
  image: string | null;
};

const MEDIA_PREFIX = "media://";
const OG_IMAGE_TTL = 60 * 60 * 24 * 30; // 30 days — crawlers cache previews

function serverSupabase() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Public metadata for a video, used for SSR OpenGraph tags on shared links. */
export const getPublicVideoMeta = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }): Promise<PublicVideoMeta | null> => {
    const supabase = serverSupabase();
    const { data: video } = await supabase
      .from("videos")
      .select("id, title, description, thumbnail_url, is_short, is_public, owner:profiles!videos_owner_id_fkey(display_name)")
      .eq("id", data.id)
      .eq("is_public", true)
      .maybeSingle();
    if (!video) return null;

    const owner = video.owner as { display_name: string | null } | null;
    let image: string | null = null;
    const thumb = video.thumbnail_url;
    if (thumb?.startsWith("http")) {
      image = thumb;
    } else if (thumb?.startsWith(MEDIA_PREFIX)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage
        .from("media")
        .createSignedUrl(thumb.slice(MEDIA_PREFIX.length), OG_IMAGE_TTL);
      image = signed?.signedUrl ?? null;
    }

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      channel: owner?.display_name ?? null,
      isShort: Boolean(video.is_short),
      image,
    };
  });
