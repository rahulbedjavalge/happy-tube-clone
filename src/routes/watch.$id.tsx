import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { VideoRow } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useMediaUrl } from "@/lib/storage";
import { formatCount, formatViews, initials, timeAgo } from "@/lib/format";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchIsSubscribed,
  fetchLikes,
  fetchRelated,
  fetchSubscriberCount,
  fetchVideo,
  recordView,
  recordWatch,
  setLike,
  toggleSubscription,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/watch/$id")({
  head: () => ({
    meta: [
      { title: "Watch on Streamly" },
      { name: "description", content: "Play the video, join the conversation and discover related channels on Streamly." },
      { property: "og:title", content: "Watch on Streamly" },
      { property: "og:description", content: "Play the video, join the conversation and discover related channels." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { data: video, isLoading } = useQuery({ queryKey: ["video", id], queryFn: () => fetchVideo(id) });
  const { data: related } = useQuery({
    queryKey: ["related", id],
    queryFn: () => fetchRelated(video!),
    enabled: Boolean(video),
  });
  const { data: comments } = useQuery({ queryKey: ["comments", id], queryFn: () => fetchComments(id) });
  const { data: likes } = useQuery({ queryKey: ["likes", id, user?.id], queryFn: () => fetchLikes(id, user?.id) });
  const { data: subCount } = useQuery({
    queryKey: ["subcount", video?.owner_id],
    queryFn: () => fetchSubscriberCount(video!.owner_id),
    enabled: Boolean(video?.owner_id),
  });
  const { data: subscribed } = useQuery({
    queryKey: ["subscribed", video?.owner_id, user?.id],
    queryFn: () => fetchIsSubscribed(video!.owner_id, user!.id),
    enabled: Boolean(video?.owner_id && user?.id),
  });
  const playbackUrl = useMediaUrl(video?.video_url);
  const posterUrl = useMediaUrl(video?.thumbnail_url);



  useEffect(() => {
    if (!video) return;
    void recordView(video.id);
    if (user) void recordWatch(video.id, user.id);
  }, [video, user]);

  const likeMutation = useMutation({
    mutationFn: async (value: number) => {
      if (!user) throw new Error("auth");
      await setLike(id, user.id, value);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["likes", id] }),
    onError: () => navigate({ to: "/auth" }),
  });

  const subMutation = useMutation({
    mutationFn: async () => {
      if (!user || !video) throw new Error("auth");
      await toggleSubscription(video.owner_id, user.id, Boolean(subscribed));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscribed"] });
      qc.invalidateQueries({ queryKey: ["subcount"] });
    },
    onError: () => navigate({ to: "/auth" }),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      await addComment(id, user.id, comment.trim());
    },
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    },
    onError: () => navigate({ to: "/auth" }),
  });

  if (isLoading) {
    return (
      <AppShell wide>
        <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
      </AppShell>
    );
  }

  if (!video) {
    return (
      <AppShell wide>
        <p className="py-20 text-center text-muted-foreground">This video is unavailable.</p>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl bg-black">
            <video
              key={video.id}
              src={playbackUrl ?? undefined}
              poster={posterUrl ?? undefined}
              controls
              autoPlay
              className="aspect-video w-full"
            />
          </div>

          <h1 className="mt-4 text-xl font-bold text-foreground">{video.title}</h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/channel/$handle" params={{ handle: video.owner?.handle ?? "" }}>
                <Avatar className="size-10">
                  <MediaAvatarImage src={video.owner?.avatar_url} />
                  <AvatarFallback>{initials(video.owner?.display_name ?? "?")}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  to="/channel/$handle"
                  params={{ handle: video.owner?.handle ?? "" }}
                  className="font-semibold text-foreground"
                >
                  {video.owner?.display_name}
                </Link>
                <p className="text-xs text-muted-foreground">{formatCount(subCount ?? 0)} subscribers</p>
              </div>
              <Button
                className="ml-3 rounded-full"
                variant={subscribed ? "secondary" : "default"}
                onClick={() => subMutation.mutate()}
              >
                {subscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-full bg-secondary">
                <button
                  onClick={() => likeMutation.mutate(likes?.mine === 1 ? 0 : 1)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent",
                    likes?.mine === 1 && "text-primary",
                  )}
                >
                  <ThumbsUp className="size-4" /> {formatCount(likes?.likes ?? 0)}
                </button>
                <span className="my-2 w-px bg-border" />
                <button
                  onClick={() => likeMutation.mutate(likes?.mine === -1 ? 0 : -1)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent",
                    likes?.mine === -1 && "text-primary",
                  )}
                >
                  <ThumbsDown className="size-4" />
                </button>
              </div>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }}
              >
                <Share2 className="mr-2 size-4" /> Share
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">
            <p className="font-medium text-foreground">
              {formatViews(video.views)} · {timeAgo(video.created_at)} · {video.category}
            </p>
            <p className={cn("mt-2 whitespace-pre-wrap text-foreground/90", !expanded && "line-clamp-2")}>
              {video.description || "No description."}
            </p>
            <button className="mt-2 text-sm font-medium text-foreground" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-foreground">{comments?.length ?? 0} Comments</h2>
            <div className="mt-4 flex gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{initials(user?.email ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={user ? "Add a comment..." : "Sign in to comment"}
                  rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setComment("")}>
                    Cancel
                  </Button>
                  <Button disabled={!comment.trim()} onClick={() => commentMutation.mutate()}>
                    Comment
                  </Button>
                </div>
              </div>
            </div>

            <ul className="mt-6 space-y-5">
              {(comments ?? []).map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar className="size-9">
                    <MediaAvatarImage src={c.author?.avatar_url} />
                    <AvatarFallback>{initials(c.author?.display_name ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {c.author?.display_name}{" "}
                      <span className="font-normal text-muted-foreground">{timeAgo(c.created_at)}</span>
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">{c.body}</p>
                    {user?.id === c.author_id ? (
                      <button
                        className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={async () => {
                          await deleteComment(c.id);
                          qc.invalidateQueries({ queryKey: ["comments", id] });
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Up next</h2>
          {(related ?? []).map((v) => (
            <VideoRow key={v.id} video={v} />
          ))}
        </aside>
      </div>
    </AppShell>
  );
}
