import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ShareDialog } from "@/components/ShareDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatCount, formatViews, initials } from "@/lib/format";
import { fetchLikes, fetchShorts, recordView, setLike, type Video } from "@/lib/queries";
import { useMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { getPublicVideoMeta } from "@/lib/video-meta.functions";


type ShortsSearch = { v?: string | undefined };

const SITE = "https://happy-tube-clone.lovable.app";

export const Route = createFileRoute("/shorts")({
  validateSearch: (search: Record<string, unknown>): ShortsSearch => ({
    v: typeof search['v'] === "string" ? (search['v'] as string) : undefined,
  }),
  loaderDeps: ({ search }) => ({ v: search.v }),
  loader: ({ deps }) => (deps.v ? getPublicVideoMeta({ data: { id: deps.v } }) : null),
  head: ({ loaderData }) => {
    const url = loaderData ? `${SITE}/shorts?v=${loaderData.id}` : `${SITE}/shorts`;
    const title = loaderData ? `${loaderData.title} — Happy Tube Clone Shorts` : "Shorts — quick vertical videos on Happy Tube Clone";
    const description =
      loaderData?.description?.slice(0, 155) ||
      (loaderData?.channel ? `Watch “${loaderData.title}” from ${loaderData.channel} on Happy Tube Clone Shorts.` : null) ||
      "Swipe through short vertical videos from Happy Tube Clone creators — under a minute each, autoplaying one after another.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: loaderData ? "video.other" : "website" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Happy Tube Clone" },
        { name: "twitter:card", content: loaderData?.image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(loaderData?.image
          ? [
              { property: "og:image", content: loaderData.image },
              { property: "og:image:alt", content: loaderData.title },
              { name: "twitter:image", content: loaderData.image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ShortsPage,
});


function ShortsPage() {
  const { v } = Route.useSearch();
  const [muted, setMuted] = useState(true);
  const { data, isLoading } = useQuery({ queryKey: ["shorts"], queryFn: () => fetchShorts() });

  const shorts = useMemo(() => {
    const list = data ?? [];
    if (!v) return list;
    const idx = list.findIndex((s) => s.id === v);
    if (idx <= 0) return list;
    return [list[idx]!, ...list.slice(0, idx), ...list.slice(idx + 1)];
  }, [data, v]);

  return (
    <AppShell wide>
      <h1 className="sr-only">Happy Tube Clone Shorts</h1>
      {isLoading ? (
        <div className="mx-auto aspect-[9/16] w-full max-w-[420px] animate-pulse rounded-2xl bg-muted" />
      ) : shorts.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">
          No shorts yet. Upload a vertical clip under 60 seconds in your studio.
        </p>
      ) : (
        <div className="h-[calc(100vh-8rem)] snap-y snap-mandatory overflow-y-auto">
          {shorts.map((s) => (
            <ShortItem key={s.id} video={s} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ShortItem({
  video,
  muted,
  onToggleMute,
}: {
  video: Video;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ref = useRef<HTMLVideoElement>(null);
  const src = useMediaUrl(video.video_url);
  const poster = useMediaUrl(video.thumbnail_url);
  const [active, setActive] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: likes } = useQuery({
    queryKey: ["likes", video.id, user?.id],
    queryFn: () => fetchLikes(video.id, user?.id),
  });

  const likeMutation = useMutation({
    mutationFn: () => setLike(video.id, user!.id, likes?.mine === 1 ? 0 : 1),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["likes", video.id] }),
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry && entry.intersectionRatio > 0.6);
        setActive(visible);
        if (visible) {
          void el.play().catch(() => undefined);
          void recordView(video.id);
        } else {
          el.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [video.id]);

  return (
    <div className="flex h-full snap-start items-center justify-center py-2">
      <div className="relative flex h-full max-h-[80vh] gap-4">
        <div className="relative h-full overflow-hidden rounded-2xl bg-black">
          <video
            ref={ref}
            src={src ?? undefined}
            poster={poster ?? undefined}
            loop
            playsInline
            muted={muted}
            className="h-full w-auto max-w-[min(92vw,420px)] object-contain"
            onClick={() => {
              const el = ref.current;
              if (!el) return;
              if (el.paused) void el.play();
              else el.pause();
            }}
          />
          <Button
            variant="secondary"
            size="icon"
            aria-label={muted ? "Unmute" : "Mute"}
            className="absolute right-3 top-3 rounded-full"
            onClick={onToggleMute}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <Link
              to="/channel/$handle"
              params={{ handle: video.owner?.handle ?? "" }}
              className="flex items-center gap-2"
            >
              <Avatar className="size-8">
                <MediaAvatarImage src={video.owner?.avatar_url} />
                <AvatarFallback>{initials(video.owner?.display_name ?? "?")}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">{video.owner?.display_name}</span>
            </Link>
            <p className="mt-2 line-clamp-2 text-sm text-white/90">{video.title}</p>
            <p className="text-xs text-white/70">{formatViews(video.views)}</p>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-5 pb-6">
          <button
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => (user ? likeMutation.mutate() : toast.error("Sign in to like shorts"))}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
              <Heart className={cn("size-5", likes?.mine === 1 && "fill-primary text-primary")} />
            </span>
            <span className="text-xs">{formatCount(likes?.likes ?? 0)}</span>
          </button>
          <Link
            to="/watch/$id"
            params={{ id: video.id }}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-xs">Comments</span>
          </Link>
          <button
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShareOpen(true)}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
              <Share2 className="size-5" />
            </span>
            <span className="text-xs">Share</span>
          </button>
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            video={{ id: video.id, title: video.title, is_short: true }}
            title="Share this Short"
          />
          <span className="sr-only">{active ? "Playing" : "Paused"}</span>
        </div>
      </div>
    </div>
  );
}
