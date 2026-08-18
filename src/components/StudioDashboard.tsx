import { useQuery } from "@tanstack/react-query";
import { Clock, DollarSign, Eye, Film, MessageSquare, Play, ThumbsUp, Users } from "lucide-react";
import { formatCount } from "@/lib/format";
import { fetchChannelAnalytics } from "@/lib/queries";
import { formatWatchTime } from "@/components/VideoAnalyticsPanel";

/** Estimated payout per 1,000 monetised views. */
const RPM_USD = 2.5;

function Card({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StudioDashboard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["channel-analytics", userId],
    queryFn: () => fetchChannelAnalytics(userId),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }
  if (!data) return <p className="text-muted-foreground">Analytics are unavailable right now.</p>;

  const earnings = (data.views / 1000) * RPM_USD;

  return (
    <section>
      <h2 className="font-semibold text-foreground">Dashboard</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={<Play className="size-3.5" />} label="Uploads" value={formatCount(data.uploads)} />
        <Card icon={<Film className="size-3.5" />} label="Shorts" value={formatCount(data.shorts)} />
        <Card icon={<Eye className="size-3.5" />} label="Total views" value={formatCount(data.views)} />
        <Card icon={<ThumbsUp className="size-3.5" />} label="Likes" value={formatCount(data.likes)} />
        <Card icon={<Users className="size-3.5" />} label="Subscribers" value={formatCount(data.subscribers)} />
        <Card icon={<Clock className="size-3.5" />} label="Watch time" value={formatWatchTime(data.watch_seconds)} />
        <Card
          icon={<MessageSquare className="size-3.5" />}
          label="Comments"
          value={formatCount(data.comments)}
          hint={`${data.pending_comments} awaiting review`}
        />
        <Card
          icon={<DollarSign className="size-3.5" />}
          label="Estimated earnings"
          value={`$${earnings.toFixed(2)}`}
          hint={`Estimate at $${RPM_USD.toFixed(2)} RPM`}
        />
      </div>
    </section>
  );
}
