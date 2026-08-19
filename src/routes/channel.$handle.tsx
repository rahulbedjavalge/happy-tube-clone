import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ShortCard, VideoGrid } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { formatCount, initials } from "@/lib/format";
import {
  fetchChannelByHandle,
  fetchChannelVideos,
  fetchIsSubscribed,
  fetchSubscriberCount,
  toggleSubscription,
} from "@/lib/queries";
import { useMediaUrl } from "@/lib/storage";

import { getPublicChannel } from "@/lib/channels.functions";

export const Route = createFileRoute("/channel/$handle")({
  loader: ({ params }) => getPublicChannel({ data: { handle: params.handle } }),
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Channel not found — Streamly" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.display_name} (@${loaderData.handle}) — Streamly`;
    const description =
      loaderData.description?.slice(0, 155) ||
      `Watch videos and Shorts from ${loaderData.display_name} on Streamly. ${loaderData.videos} videos.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData.avatar_url?.startsWith("http")
          ? [
              { property: "og:image", content: loaderData.avatar_url },
              { name: "twitter:image", content: loaderData.avatar_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: `/channel/${params.handle}` }],
    };
  },
  errorComponent: () => (
    <AppShell>
      <p className="py-20 text-center text-muted-foreground">Couldn't load this channel. Try again later.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="py-20 text-center text-muted-foreground">Channel not found.</p>
    </AppShell>
  ),
  component: ChannelPage,
});

function ChannelPage() {
  const { handle } = Route.useParams();
  const publicChannel = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: channel, isLoading } = useQuery({
    queryKey: ["channel", handle],
    queryFn: () => fetchChannelByHandle(handle),
    initialData: publicChannel ? (publicChannel as unknown as Awaited<ReturnType<typeof fetchChannelByHandle>>) : undefined,
  });
  const { data: videos } = useQuery({
    queryKey: ["channel-videos", channel?.id],
    queryFn: () => fetchChannelVideos(channel!.id),
    enabled: Boolean(channel?.id),
  });

  const { data: subCount } = useQuery({
    queryKey: ["subcount", channel?.id],
    queryFn: () => fetchSubscriberCount(channel!.id),
    enabled: Boolean(channel?.id),
  });
  const { data: subscribed } = useQuery({
    queryKey: ["subscribed", channel?.id, user?.id],
    queryFn: () => fetchIsSubscribed(channel!.id, user!.id),
    enabled: Boolean(channel?.id && user?.id),
  });

  const bannerUrl = useMediaUrl(channel?.banner_url);
  const avatarUrl = useMediaUrl(channel?.avatar_url);
  const longVideos = (videos ?? []).filter((v) => !v.is_short);
  const shorts = (videos ?? []).filter((v) => v.is_short);

  const subMutation = useMutation({
    mutationFn: async () => {
      if (!user || !channel) throw new Error("auth");
      await toggleSubscription(channel.id, user.id, Boolean(subscribed));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscribed"] });
      qc.invalidateQueries({ queryKey: ["subcount"] });
    },
    onError: () => navigate({ to: "/auth" }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
      </AppShell>
    );
  }

  if (!channel) {
    return (
      <AppShell>
        <p className="py-20 text-center text-muted-foreground">Channel not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-32 w-full overflow-hidden rounded-2xl bg-muted sm:h-44">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar className="size-20">
          <MediaAvatarImage src={avatarUrl} />
          <AvatarFallback className="text-2xl">{initials(channel.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{channel.display_name}</h1>
          <p className="text-sm text-muted-foreground">
            @{channel.handle} · {formatCount(subCount ?? publicChannel?.subscribers ?? 0)} subscribers ·{" "}
            {videos?.length ?? publicChannel?.videos ?? 0} videos
          </p>

        </div>
        {user?.id === channel.id ? null : user ? (
          <Button
            className="rounded-full"
            variant={subscribed ? "secondary" : "default"}
            disabled={subMutation.isPending}
            onClick={() => subMutation.mutate()}
          >
            {subMutation.isPending ? "…" : subscribed ? "Subscribed" : "Subscribe"}
          </Button>
        ) : (
          <Button asChild className="rounded-full">
            <Link to="/auth">Subscribe</Link>
          </Button>
        )}

      </div>

      <Tabs defaultValue="videos" className="mt-6">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="shorts">Shorts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="pt-6">
          {longVideos.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No videos published yet.</p>
          ) : (
            <VideoGrid videos={longVideos} />
          )}
        </TabsContent>
        <TabsContent value="shorts" className="pt-6">
          {shorts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No shorts yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {shorts.map((s) => (
                <ShortCard key={s.id} video={s} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="about" className="pt-6">
          <p className="max-w-2xl whitespace-pre-wrap text-sm text-foreground/90">
            {channel.description || "This channel hasn't added a description yet."}
          </p>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
