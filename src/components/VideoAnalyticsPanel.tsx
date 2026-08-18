import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, Eye, ThumbsUp, Users } from "lucide-react";
import { fetchVideoAnalytics, type Bucket } from "@/lib/queries";
import { formatCount } from "@/lib/format";

export function formatWatchTime(seconds: number): string {
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1).replace(/\.0$/, "")} hrs`;
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds)} sec`;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function BucketBars({ title, buckets }: { title: string; buckets: Bucket[] }) {
  const total = buckets.reduce((sum, b) => sum + b.value, 0);
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {buckets.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No audience data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {buckets.map((b) => {
            const pct = total ? Math.round((b.value / total) * 100) : 0;
            return (
              <li key={b.label} className="text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-foreground">{b.label}</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Owner-only analytics for a single video. */
export function VideoAnalyticsPanel({ videoId }: { videoId: string }) {
  const { data } = useQuery({ queryKey: ["video-analytics", videoId], queryFn: () => fetchVideoAnalytics(videoId) });
  if (!data) return null;
  const avg = data.viewers ? data.watch_seconds / data.viewers : 0;

  return (
    <section className="mt-6 rounded-xl border border-border p-5">
      <h2 className="flex items-center gap-2 font-semibold text-foreground">
        <BarChart3 className="size-4" /> Video analytics
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Eye className="size-3.5" />} label="Views" value={formatCount(data.views)} />
        <Stat icon={<ThumbsUp className="size-3.5" />} label="Likes" value={formatCount(data.likes)} />
        <Stat icon={<Clock className="size-3.5" />} label="Watch time" value={formatWatchTime(data.watch_seconds)} />
        <Stat icon={<Users className="size-3.5" />} label="Avg. view duration" value={formatWatchTime(avg)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <BucketBars title="Top countries" buckets={data.countries} />
        <BucketBars title="Age ranges" buckets={data.ages} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Demographics are aggregated and anonymous, based on viewers who shared a country and age range in channel
        settings.
      </p>
    </section>
  );
}
