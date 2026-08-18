import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { VideoGrid } from "@/components/VideoCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import { fetchSubscribedChannels, fetchSubscriptionFeed } from "@/lib/queries";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Streamly" },
      { name: "description", content: "The newest uploads from every Streamly channel you subscribe to." },
      { property: "og:title", content: "Subscriptions — Streamly" },
      { property: "og:description", content: "The newest uploads from every channel you subscribe to." },
    ],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
      <RequireAuth title="Follow the channels you enjoy">
        <SubscriptionsFeed />
      </RequireAuth>
    </AppShell>
  );
}

function SubscriptionsFeed() {
  const { user } = useAuth();
  const { data: channels } = useQuery({
    queryKey: ["subscribed-channels", user?.id],
    queryFn: () => fetchSubscribedChannels(user!.id),
  });
  const { data: videos } = useQuery({
    queryKey: ["sub-feed", user?.id],
    queryFn: () => fetchSubscriptionFeed(user!.id),
  });

  return (
    <div className="mt-6">
      {(channels?.length ?? 0) > 0 ? (
        <div className="mb-8 flex flex-wrap gap-5">
          {(channels ?? []).map((c) => (
            <Link
              key={c.id}
              to="/channel/$handle"
              params={{ handle: c.handle }}
              className="flex w-20 flex-col items-center gap-2 text-center"
            >
              <Avatar className="size-14">
                <MediaAvatarImage src={c.avatar_url} />
                <AvatarFallback>{initials(c.display_name)}</AvatarFallback>
              </Avatar>
              <span className="line-clamp-1 text-xs text-muted-foreground">{c.display_name}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {(videos?.length ?? 0) === 0 ? (
        <p className="py-12 text-muted-foreground">No uploads yet. Subscribe to channels to fill this feed.</p>
      ) : (
        <VideoGrid videos={videos ?? []} />
      )}
    </div>
  );
}
