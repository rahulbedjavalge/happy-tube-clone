import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Thumbnail } from "@/components/VideoCard";
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
import { formatViews, timeAgo } from "@/lib/format";
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
      { title: "Creator Studio — Streamly" },
      { name: "description", content: "Publish new videos, edit your uploads and manage your Streamly channel." },
      { property: "og:title", content: "Creator Studio — Streamly" },
      { property: "og:description", content: "Publish new videos, edit uploads and manage your channel." },
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<VideoInput>(emptyInput);

  const { data: profile } = useQuery({ queryKey: ["profile", user?.id], queryFn: () => fetchProfile(user!.id) });
  const { data: videos } = useQuery({
    queryKey: ["channel-videos", user?.id],
    queryFn: () => fetchChannelVideos(user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, thumbnail_url: form.thumbnail_url || null };
      if (editing) await updateVideo(editing.id, payload);
      else await createVideo(user!.id, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Video updated" : "Video published");
      setOpen(false);
      setEditing(null);
      setForm(emptyInput);
      qc.invalidateQueries({ queryKey: ["channel-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => {
      toast.success("Video deleted");
      qc.invalidateQueries({ queryKey: ["channel-videos"] });
    },
  });

  const [channelName, setChannelName] = useState("");
  const [channelBio, setChannelBio] = useState("");

  const profileMutation = useMutation({
    mutationFn: () =>
      updateProfile(user!.id, {
        display_name: channelName || profile?.display_name || "Channel",
        description: channelBio || profile?.description || null,
      }),
    onSuccess: () => {
      toast.success("Channel updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return (
    <div className="mt-6 space-y-10">
      <section className="rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground">Channel settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cname">Display name</Label>
            <Input
              id="cname"
              className="mt-1.5"
              value={channelName}
              placeholder={profile?.display_name ?? "Your channel"}
              onChange={(e) => setChannelName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cbio">Description</Label>
            <Input
              id="cbio"
              className="mt-1.5"
              value={channelBio}
              placeholder={profile?.description ?? "Tell viewers about your channel"}
              onChange={(e) => setChannelBio(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => profileMutation.mutate()}>Save channel</Button>
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

      <section>
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
            <Plus className="mr-2 size-4" /> New video
          </Button>
        </div>

        <ul className="mt-5 space-y-4">
          {(videos ?? []).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3">
              <Thumbnail video={v} className="w-40 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium text-foreground">{v.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatViews(v.views)} · {timeAgo(v.created_at)} · {v.is_public ? "Public" : "Private"}
                </p>
              </div>
              <div className="flex gap-2">
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
            <DialogTitle>{editing ? "Edit video" : "Publish a video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label htmlFor="url">Video URL (mp4)</Label>
              <Input
                id="url"
                className="mt-1.5"
                placeholder="https://..."
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="thumb">Thumbnail URL</Label>
              <Input
                id="thumb"
                className="mt-1.5"
                placeholder="https://..."
                value={form.thumbnail_url ?? ""}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              />
            </div>
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
                <Label htmlFor="dur">Duration (seconds)</Label>
                <Input
                  id="dur"
                  type="number"
                  className="mt-1.5"
                  value={form.duration_seconds}
                  onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pub"
                checked={form.is_public}
                onCheckedChange={(v) => setForm({ ...form, is_public: v })}
              />
              <Label htmlFor="pub">Public</Label>
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
    </div>
  );
}
