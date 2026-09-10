import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Thumbnail } from "@/components/VideoCard";
import { ImageUploadField, VideoUploadField } from "@/components/UploadFields";
import { StudioDashboard } from "@/components/StudioDashboard";
import { ShareButton, ShareDialog } from "@/components/ShareDialog";
import { CommentModeration } from "@/components/CommentModeration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { formatDuration, formatViews, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MAX_DURATION_SECONDS, SHORT_MAX_SECONDS } from "@/lib/storage";
import {
  CATEGORIES,
  createVideo,
  deleteVideo,
  fetchChannelVideos,
  fetchProfile,
  updateProfile,
  updateVideo,
  type Video,
  type VideoInput,
} from "@/lib/queries";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio — Happy Tube Clone" },
      { name: "description", content: "Upload videos and shorts, edit your uploads and manage your Happy Tube Clone channel." },
      { property: "og:title", content: "Creator Studio — Happy Tube Clone" },
      { property: "og:description", content: "Upload videos and shorts, edit uploads and manage your channel." },
    ],
  }),
  component: StudioPage,
});

const emptyInput: VideoInput = {
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  category: "Film",
  duration_seconds: 60,
  is_public: true,
  is_short: false,
};

function StudioPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Creator Studio</h1>
      <RequireAuth title="Manage your channel">
        <Studio />
      </RequireAuth>
    </AppShell>
  );
}

function Studio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dashboard" | "videos" | "comments" | "settings">("dashboard");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoInput>(emptyInput);
  const [shareVideo, setShareVideo] = useState<{ id: string; title: string; is_short: boolean } | null>(null);

  const { data: videos } = useQuery({
    queryKey: ["channel-videos", user?.id],
    queryFn: () => fetchChannelVideos(user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (form.duration_seconds > MAX_DURATION_SECONDS) throw new Error("Videos can be at most 10 minutes long");
      if (form.is_short && form.duration_seconds > SHORT_MAX_SECONDS)
        throw new Error("Shorts can be at most 60 seconds long");
      const payload = { ...form, thumbnail_url: form.thumbnail_url || null };
      if (editing) {
        await updateVideo(editing.id, payload);
        return null;
      }
      const created = await createVideo(user!.id, payload);
      return { id: created.id, title: form.title, is_short: form.is_short };
    },
    onSuccess: (created) => {
      toast.success(editing ? "Video updated" : "Video published");
      if (created) setShareVideo(created);
      setOpen(false);
      setEditing(null);
      setForm(emptyInput);
      qc.invalidateQueries({ queryKey: ["channel-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["shorts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => {
      toast.success("Video deleted");
      qc.invalidateQueries({ queryKey: ["channel-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["shorts"] });
    },
  });

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "videos", label: "Videos" },
    { id: "comments", label: "Comments" },
    { id: "settings", label: "Settings" },
  ] as const;

  return (
    <div className="mt-6 space-y-8">
      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm",
              tab === t.id ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" ? <StudioDashboard userId={user!.id} /> : null}
      {tab === "comments" ? <CommentModeration userId={user!.id} /> : null}
      {tab === "settings" ? <ChannelSettings userId={user!.id} /> : null}

      <section className={cn(tab === "videos" ? "" : "hidden")}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Your videos ({videos?.length ?? 0})</h2>
          <Button
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setForm(emptyInput);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Upload
          </Button>
        </div>

        <ul className="mt-5 space-y-4">
          {(videos ?? []).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3">
              <Thumbnail video={v} className="w-40 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium text-foreground">{v.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(v.views)} · {timeAgo(v.created_at)} · {formatDuration(v.duration_seconds)} ·{" "}
                  {v.is_short ? "Short" : "Video"} · {v.is_public ? "Public" : "Private"}
                </p>
              </div>
              <div className="flex gap-2">
                <ShareButton video={v} variant="secondary" label={null} className="h-9 px-3" />
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/watch/$id" params={{ id: v.id }} title="View analytics">
                    <BarChart3 className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(v);
                    setForm({
                      title: v.title,
                      description: v.description,
                      video_url: v.video_url,
                      thumbnail_url: v.thumbnail_url ?? "",
                      category: v.category,
                      duration_seconds: v.duration_seconds,
                      is_public: v.is_public,
                      is_short: v.is_short,
                    });
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(v.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
          {(videos?.length ?? 0) === 0 ? (
            <p className="py-10 text-muted-foreground">No uploads yet. Publish your first video.</p>
          ) : null}
        </ul>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit video" : "Upload a video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing ? (
              <VideoUploadField
                userId={user!.id}
                currentUrl={form.video_url}
                onUploaded={(r) =>
                  setForm((f) => ({
                    ...f,
                    video_url: r.video_url,
                    thumbnail_url: r.thumbnail_url ?? f.thumbnail_url,
                    duration_seconds: r.duration_seconds,
                    is_short: r.is_short,
                  }))
                }
              />
            ) : null}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-1.5"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                className="mt-1.5"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="url">Video URL (or upload above)</Label>
              <Input
                id="url"
                className="mt-1.5"
                placeholder="https://..."
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
            </div>
            <ImageUploadField
              userId={user!.id}
              label="Thumbnail"
              value={form.thumbnail_url}
              onUploaded={(ref) => setForm((f) => ({ ...f, thumbnail_url: ref }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cat">Category</Label>
                <select
                  id="cat"
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="dur">Duration (seconds, max 600)</Label>
                <Input
                  id="dur"
                  type="number"
                  max={MAX_DURATION_SECONDS}
                  className="mt-1.5"
                  value={form.duration_seconds}
                  onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="pub"
                  checked={form.is_public}
                  onCheckedChange={(v) => setForm({ ...form, is_public: v })}
                />
                <Label htmlFor="pub">Public</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="short"
                  checked={form.is_short}
                  onCheckedChange={(v) => setForm({ ...form, is_short: v })}
                />
                <Label htmlFor="short">Publish as Short (≤ 60s)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.title.trim() || !form.video_url.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {shareVideo ? (
        <ShareDialog
          open={Boolean(shareVideo)}
          onOpenChange={(o) => !o && setShareVideo(null)}
          video={shareVideo}
          title="Your video is live — share it"
          description={
            shareVideo.is_short
              ? "Copy the link below or send your Short straight to friends."
              : "Copy the link below or send your video straight to friends."
          }
        />
      ) : null}
    </div>
  );
}

function ChannelSettings({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [ageRange, setAgeRange] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setHandle(profile.handle);
    setDescription(profile.description ?? "");
    setAvatar(profile.avatar_url);
    setBanner(profile.banner_url);
    setCountry(profile.country ?? "");
    setAgeRange(profile.age_range ?? "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (cleanHandle.length < 3) throw new Error("Handle must be at least 3 characters");
      if (!displayName.trim()) throw new Error("Display name is required");
      await updateProfile(userId, {
        display_name: displayName.trim(),
        handle: cleanHandle,
        description: description.trim() || null,
        avatar_url: avatar,
        banner_url: banner,
        country: country.trim() || null,
        age_range: ageRange || null,
      });
      return cleanHandle;
    },
    onSuccess: (cleanHandle) => {
      setHandle(cleanHandle);
      toast.success("Channel updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["channel"] });
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "That handle is already taken" : e.message),
  });

  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="font-semibold text-foreground">Channel settings</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cname">Display name</Label>
          <Input id="cname" className="mt-1.5" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="chandle">Handle</Label>
          <Input
            id="chandle"
            className="mt-1.5"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="yourchannel"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cbio">About</Label>
          <Textarea
            id="cbio"
            rows={3}
            className="mt-1.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about your channel"
          />
        </div>
        <div>
          <Label htmlFor="ccountry">Country (optional)</Label>
          <Input
            id="ccountry"
            className="mt-1.5"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Germany"
          />
        </div>
        <div>
          <Label htmlFor="cage">Age range (optional)</Label>
          <select
            id="cage"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
          >
            <option value="">Prefer not to say</option>
            {["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Country and age range are never shown publicly — they only feed anonymous, aggregated audience stats for
          creators whose videos you watch.
        </p>
        <ImageUploadField userId={userId} label="Avatar" value={avatar} onUploaded={setAvatar} />
        <ImageUploadField userId={userId} label="Banner" value={banner} onUploaded={setBanner} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Save channel
        </Button>
        {profile ? (
          <Link
            to="/channel/$handle"
            params={{ handle: profile.handle }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View public page
          </Link>
        ) : null}
      </div>
    </section>
  );
}
