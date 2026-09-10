import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VideoGrid } from "@/components/VideoCard";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { fetchLikedVideos } from "@/lib/queries";

export const Route = createFileRoute("/liked")({
  head: () => ({
    meta: [
      { title: "Liked videos — Happy Tube Clone" },
      { name: "description", content: "Every video you have given a thumbs up on Happy Tube Clone, in one place." },
      { property: "og:title", content: "Liked videos — Happy Tube Clone" },
      { property: "og:description", content: "Every video you have given a thumbs up, in one place." },
    ],
  }),
  component: LikedPage,
});

function LikedPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Liked videos</h1>
      <RequireAuth title="Save the videos you love">
        <LikedList />
      </RequireAuth>
    </AppShell>
  );
}

function LikedList() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["liked", user?.id], queryFn: () => fetchLikedVideos(user!.id) });

  if ((data?.length ?? 0) === 0) {
    return <p className="py-12 text-muted-foreground">You haven't liked any videos yet.</p>;
  }

  return (
    <div className="mt-6">
      <VideoGrid videos={data ?? []} />
    </div>
  );
}
