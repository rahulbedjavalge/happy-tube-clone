import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { formatCount, initials } from "@/lib/format";
import { listPublicChannels } from "@/lib/channels.functions";

const TITLE = "Browse channels — Streamly";
const DESCRIPTION = "Discover creators on Streamly: browse every public channel, see their about page, avatar and banner.";

export const Route = createFileRoute("/channels")({
  loader: () => listPublicChannels(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <AppShell>
      <p className="py-20 text-center text-muted-foreground">Couldn't load channels. Try again later.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="py-20 text-center text-muted-foreground">Nothing here.</p>
    </AppShell>
  ),
  component: ChannelsPage,
});

function ChannelsPage() {
  const channels = Route.useLoaderData();

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Channels</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every public channel on Streamly.</p>

      {channels.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No channels yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <li key={c.id}>
              <Link
                to="/channel/$handle"
                params={{ handle: c.handle }}
                className="flex h-full gap-4 rounded-2xl border border-border p-4 transition-colors hover:bg-accent"
              >
                <Avatar className="size-14 shrink-0">
                  <MediaAvatarImage src={c.avatar_url} alt={c.display_name} />
                  <AvatarFallback>{initials(c.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{c.handle} · {formatCount(c.subscribers)} subscribers · {c.videos} videos
                  </p>
                  {c.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
