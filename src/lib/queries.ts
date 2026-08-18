import { supabase } from "@/integrations/supabase/client";

export type ChannelLink = { label: string; url: string };

export type Channel = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  description: string | null;
  links?: ChannelLink[] | null;
  created_at?: string;
};

export type Video = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  duration_seconds: number;
  views: number;
  is_public: boolean;
  is_short: boolean;
  created_at: string;
  owner: Pick<Channel, "id" | "handle" | "display_name" | "avatar_url"> | null;
};

const VIDEO_SELECT =
  "id, owner_id, title, description, video_url, thumbnail_url, category, duration_seconds, views, is_public, is_short, created_at, owner:profiles!videos_owner_id_fkey(id, handle, display_name, avatar_url)";

export const CATEGORIES = ["All", "Animation", "Film", "Tech", "Travel", "Music", "Gaming"] as const;

function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

export async function fetchVideos(category?: string): Promise<Video[]> {
  let query = supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("is_public", true)
    .eq("is_short", false)
    .order("created_at", { ascending: false })
    .limit(60);
  if (category && category !== "All") query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return rows<Video>(data);
}

export async function fetchShorts(ownerId?: string): Promise<Video[]> {
  let query = supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("is_public", true)
    .eq("is_short", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return rows<Video>(data);
}

export async function fetchVideo(id: string): Promise<Video | null> {
  const { data, error } = await supabase.from("videos").select(VIDEO_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Video | null) ?? null;
}

export async function fetchRelated(video: Video): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("is_public", true)
    .neq("id", video.id)
    .order("views", { ascending: false })
    .limit(12);
  if (error) throw error;
  return rows<Video>(data);
}

export async function searchVideos(q: string, sort: "newest" | "views"): Promise<Video[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("is_public", true)
    .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    .order(sort === "views" ? "views" : "created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return rows<Video>(data);
}

export async function fetchChannelByHandle(handle: string): Promise<Channel | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle();
  if (error) throw error;
  return (data as Channel | null) ?? null;
}

export async function fetchProfile(id: string): Promise<Channel | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Channel | null) ?? null;
}

export async function fetchChannelVideos(ownerId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows<Video>(data);
}

export async function fetchSubscriberCount(channelId: string): Promise<number> {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", channelId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchIsSubscribed(channelId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("channel_id", channelId)
    .eq("subscriber_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function toggleSubscription(channelId: string, userId: string, subscribed: boolean) {
  if (subscribed) {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("channel_id", channelId)
      .eq("subscriber_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .insert({ channel_id: channelId, subscriber_id: userId });
    if (error) throw error;
  }
}

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: Pick<Channel, "handle" | "display_name" | "avatar_url"> | null;
};

export async function fetchComments(videoId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, author:profiles!comments_author_id_fkey(handle, display_name, avatar_url)")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows<Comment>(data);
}

export async function addComment(videoId: string, authorId: string, body: string) {
  const { error } = await supabase.from("comments").insert({ video_id: videoId, author_id: authorId, body });
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export type LikeState = { likes: number; dislikes: number; mine: number };

export async function fetchLikes(videoId: string, userId?: string): Promise<LikeState> {
  const { data, error } = await supabase.from("video_likes").select("user_id, value").eq("video_id", videoId);
  if (error) throw error;
  const list = rows<{ user_id: string; value: number }>(data);
  return {
    likes: list.filter((l) => l.value === 1).length,
    dislikes: list.filter((l) => l.value === -1).length,
    mine: userId ? (list.find((l) => l.user_id === userId)?.value ?? 0) : 0,
  };
}

export async function setLike(videoId: string, userId: string, value: number) {
  if (value === 0) {
    const { error } = await supabase.from("video_likes").delete().eq("video_id", videoId).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("video_likes")
    .upsert({ video_id: videoId, user_id: userId, value }, { onConflict: "video_id,user_id" });
  if (error) throw error;
}

export async function recordView(videoId: string) {
  await supabase.rpc("increment_video_views", { _video_id: videoId });
}

export async function recordWatch(videoId: string, userId: string) {
  await supabase
    .from("watch_history")
    .upsert({ video_id: videoId, user_id: userId, watched_at: new Date().toISOString() }, { onConflict: "user_id,video_id" });
}

export async function fetchHistory(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("watch_history")
    .select(`watched_at, video:videos!watch_history_video_id_fkey(${VIDEO_SELECT})`)
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return rows<{ video: Video | null }>(data)
    .map((r) => r.video)
    .filter((v): v is Video => Boolean(v));
}

export async function fetchLikedVideos(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("video_likes")
    .select(`created_at, video:videos!video_likes_video_id_fkey(${VIDEO_SELECT})`)
    .eq("user_id", userId)
    .eq("value", 1)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows<{ video: Video | null }>(data)
    .map((r) => r.video)
    .filter((v): v is Video => Boolean(v));
}

export async function fetchSubscriptionFeed(userId: string): Promise<Video[]> {
  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("channel_id")
    .eq("subscriber_id", userId);
  if (subsError) throw subsError;
  const ids = rows<{ channel_id: string }>(subs).map((s) => s.channel_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .in("owner_id", ids)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows<Video>(data);
}

export async function fetchSubscribedChannels(userId: string): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("channel:profiles!subscriptions_channel_id_fkey(id, handle, display_name, avatar_url, banner_url, description)")
    .eq("subscriber_id", userId);
  if (error) throw error;
  return rows<{ channel: Channel | null }>(data)
    .map((r) => r.channel)
    .filter((c): c is Channel => Boolean(c));
}

export type VideoInput = {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  duration_seconds: number;
  is_public: boolean;
  is_short: boolean;
};

export async function createVideo(ownerId: string, input: VideoInput) {
  const { error } = await supabase.from("videos").insert({ ...input, owner_id: ownerId });
  if (error) throw error;
}

export async function updateVideo(id: string, input: Partial<VideoInput>) {
  const { error } = await supabase.from("videos").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProfile(id: string, patch: Partial<Channel>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}
