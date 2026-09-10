import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VideoRow } from "@/components/VideoCard";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { fetchHistory } from "@/lib/queries";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Watch history — Happy Tube Clone" },
      { name: "description", content: "Revisit every video you have watched on Happy Tube Clone, newest first." },
      { property: "og:title", content: "Watch history — Happy Tube Clone" },
      { property: "og:description", content: "Revisit every video you have watched, newest first." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Watch history</h1>
      <RequireAuth title="Keep track of what you watch">
        <HistoryList />
      </RequireAuth>
    </AppShell>
  );
}

function HistoryList() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["history", user?.id], queryFn: () => fetchHistory(user!.id) });

  if ((data?.length ?? 0) === 0) {
    return <p className="py-12 text-muted-foreground">Nothing here yet — start watching.</p>;
  }

  return (
    <div className="mt-6 max-w-4xl space-y-5">
      {(data ?? []).map((v) => (
        <VideoRow key={v.id} video={v} />
      ))}
    </div>
  );
}
