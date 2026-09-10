import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchVideo } from "@/lib/queries";
import { useMediaUrl } from "@/lib/storage";

type EmbedSearch = { autoplay?: boolean; muted?: boolean; loop?: boolean; controls?: boolean };

const flag = (value: unknown, fallback: boolean) =>
  value === undefined ? fallback : value === "1" || value === 1 || value === true || value === "true";

export const Route = createFileRoute("/embed/$id")({
  validateSearch: (search: Record<string, unknown>): EmbedSearch => ({
    autoplay: flag(search["autoplay"], false),
    muted: flag(search["muted"], false),
    loop: flag(search["loop"], false),
    controls: flag(search["controls"], true),
  }),
  head: () => ({
    meta: [
      { title: "Happy Tube Clone embedded player" },
      { name: "description", content: "Embedded Happy Tube Clone video player." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmbedPage,
});

function EmbedPage() {
  const { id } = Route.useParams();
  const { autoplay, muted, loop, controls } = Route.useSearch();
  const { data: video } = useQuery({ queryKey: ["video", id], queryFn: () => fetchVideo(id) });
  const src = useMediaUrl(video?.video_url);
  const poster = useMediaUrl(video?.thumbnail_url);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      {video ? (
        <video
          src={src ?? undefined}
          poster={poster ?? undefined}
          controls={controls}
          autoPlay={autoplay}
          muted={autoplay ? true : muted}
          loop={loop}
          playsInline
          title={video.title}
          className="h-full w-full object-contain"
        />
      ) : (
        <p className="text-sm text-white/70">This video is unavailable.</p>
      )}
    </div>
  );
}
