import { Link } from "@tanstack/react-router";
import type { Video } from "@/lib/queries";
import { formatDuration, formatViews, initials, timeAgo } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMediaUrl } from "@/lib/storage";

export function Thumbnail({ video, className }: { video: Video; className?: string }) {
  const thumb = useMediaUrl(video.thumbnail_url);
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-muted", className)}>
      {thumb ? (
        <img
          src={thumb}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : null}
      <span className="absolute bottom-1.5 right-1.5 rounded bg-overlay px-1.5 py-0.5 text-xs font-medium text-overlay-foreground">
        {formatDuration(video.duration_seconds)}
      </span>
    </div>
  );
}

export function VideoCard({ video }: { video: Video }) {
  return (
    <article className="group">
      <Link to="/watch/$id" params={{ id: video.id }} className="block">
        <Thumbnail video={video} />
      </Link>
      <div className="mt-3 flex gap-3">
        <Link
          to="/channel/$handle"
          params={{ handle: video.owner?.handle ?? "" }}
          className="shrink-0"
          aria-label={video.owner?.display_name ?? "Channel"}
        >
          <Avatar className="size-9">
            <AvatarImage src={video.owner?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initials(video.owner?.display_name ?? "?")}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <Link to="/watch/$id" params={{ id: video.id }}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{video.title}</h3>
          </Link>
          <Link
            to="/channel/$handle"
            params={{ handle: video.owner?.handle ?? "" }}
            className="mt-1 block truncate text-sm text-muted-foreground hover:text-foreground"
          >
            {video.owner?.display_name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatViews(video.views)} · {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function VideoRow({ video }: { video: Video }) {
  return (
    <article className="group flex gap-3">
      <Link to="/watch/$id" params={{ id: video.id }} className="w-40 shrink-0 sm:w-64">
        <Thumbnail video={video} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to="/watch/$id" params={{ id: video.id }}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
            {video.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {formatViews(video.views)} · {timeAgo(video.created_at)}
        </p>
        <Link
          to="/channel/$handle"
          params={{ handle: video.owner?.handle ?? "" }}
          className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground sm:text-sm"
        >
          {video.owner?.display_name}
        </Link>
        <p className="mt-1 hidden line-clamp-2 text-xs text-muted-foreground sm:block">{video.description}</p>
      </div>
    </article>
  );
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
          <div className="mt-3 flex gap-3">
            <div className="size-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShortCard({ video }: { video: Video }) {
  const thumb = useMediaUrl(video.thumbnail_url);
  return (
    <Link to="/shorts" search={{ v: video.id }} className="group block w-40 shrink-0 sm:w-44">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted">
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{video.title}</h3>
      <p className="text-xs text-muted-foreground">{formatViews(video.views)}</p>
    </Link>
  );
}

export function ShortsRow({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold text-foreground">Shorts</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {videos.map((v) => (
          <ShortCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}
