import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VideoGrid, VideoGridSkeleton } from "@/components/VideoCard";
import { CATEGORIES, fetchVideos } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Streamly — Watch trending videos and shorts" },
      {
        name: "description",
        content: "Stream films, animation, tech and travel videos, follow channels and share your own uploads on Streamly.",
      },
      { property: "og:title", content: "Streamly — Watch trending videos and shorts" },
      {
        property: "og:description",
        content: "Stream films, animation, tech and travel videos, follow channels and share your own uploads.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [category, setCategory] = useState<string>("All");
  const { data, isLoading } = useQuery({
    queryKey: ["videos", category],
    queryFn: () => fetchVideos(category),
  });

  return (
    <AppShell>
      <h1 className="sr-only">Streamly home feed</h1>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      {isLoading ? <VideoGridSkeleton /> : <VideoGrid videos={data ?? []} />}
      {!isLoading && (data?.length ?? 0) === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No videos in this category yet.</p>
      ) : null}
    </AppShell>
  );
}
