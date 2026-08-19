import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicChannel = {
  id: string;
  handle: string;
  display_name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string | null;
  subscribers: number;
  videos: number;
};

function serverSupabase() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Public, unauthenticated channel lookup used for SSR + shareable metadata. */
export const getPublicChannel = createServerFn({ method: "GET" })
  .inputValidator((data: { handle: string }) => ({ handle: String(data.handle).toLowerCase() }))
  .handler(async ({ data }): Promise<PublicChannel | null> => {
    const supabase = serverSupabase();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, handle, display_name, description, avatar_url, banner_url, created_at")
      .eq("handle", data.handle)
      .maybeSingle();
    if (!profile) return null;

    const [{ count: subscribers }, { count: videos }] = await Promise.all([
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("channel_id", profile.id),
      supabase.from("videos").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
    ]);

    return {
      ...(profile as Omit<PublicChannel, "subscribers" | "videos">),
      subscribers: subscribers ?? 0,
      videos: videos ?? 0,
    };
  });

/** Public directory of channels so visitors can discover creators. */
export const listPublicChannels = createServerFn({ method: "GET" }).handler(async (): Promise<PublicChannel[]> => {
  const supabase = serverSupabase();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name, description, avatar_url, banner_url, created_at")
    .order("created_at", { ascending: true })
    .limit(60);
  const list = (profiles ?? []) as Omit<PublicChannel, "subscribers" | "videos">[];
  if (list.length === 0) return [];

  const { data: subs } = await supabase.from("subscriptions").select("channel_id");
  const { data: vids } = await supabase.from("videos").select("owner_id");
  const tally = (arr: { k: string }[]) =>
    arr.reduce<Record<string, number>>((acc, r) => ((acc[r.k] = (acc[r.k] ?? 0) + 1), acc), {});
  const subCount = tally(((subs ?? []) as { channel_id: string }[]).map((s) => ({ k: s.channel_id })));
  const vidCount = tally(((vids ?? []) as { owner_id: string }[]).map((v) => ({ k: v.owner_id })));

  return list
    .map((p) => ({ ...p, subscribers: subCount[p.id] ?? 0, videos: vidCount[p.id] ?? 0 }))
    .sort((a, b) => b.subscribers - a.subscribers || b.videos - a.videos);
});
