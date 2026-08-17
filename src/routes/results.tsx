import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { VideoRow } from "@/components/VideoCard";
import { searchVideos } from "@/lib/queries";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  sort: z.enum(["newest", "views"]).optional().default("newest"),
});

export const Route = createFileRoute("/results")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search results — Streamly" },
      { name: "description", content: "Find videos across every Streamly channel and sort by newest or most watched." },
      { property: "og:title", content: "Search results — Streamly" },
      { property: "og:description", content: "Find videos across every channel and sort by newest or most watched." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { q, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["search", q, sort],
    queryFn: () => searchVideos(q, sort),
  });

  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-foreground">
        Results for <span className="text-primary">{q}</span>
      </h1>
      <div className="mt-3 flex gap-2">
        {(["newest", "views"] as const).map((s) => (
          <button
            key={s}
            onClick={() => navigate({ search: { q, sort: s } })}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              sort === s ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {s === "newest" ? "Newest" : "Most viewed"}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-4xl space-y-5">
        {isLoading ? <p className="text-muted-foreground">Searching…</p> : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <p className="py-12 text-muted-foreground">No videos matched your search.</p>
        ) : null}
        {(data ?? []).map((v) => (
          <VideoRow key={v.id} video={v} />
        ))}
      </div>
    </AppShell>
  );
}
