import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import { initials, timeAgo } from "@/lib/format";
import { deleteComment, fetchModerationComments, setCommentApproval } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Filter = "pending" | "approved" | "all";

export function CommentModeration({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["moderation-comments", userId],
    queryFn: () => fetchModerationComments(userId),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["moderation-comments"] });
    qc.invalidateQueries({ queryKey: ["comments"] });
    qc.invalidateQueries({ queryKey: ["channel-analytics"] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => setCommentApproval(id, approved),
    onSuccess: (_d, v) => {
      toast.success(v.approved ? "Comment approved" : "Comment hidden");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      toast.success("Comment deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (comments ?? []).filter((c) =>
    filter === "all" ? true : filter === "pending" ? !c.approved : c.approved,
  );
  const pendingCount = (comments ?? []).filter((c) => !c.approved).length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">
          Comments {pendingCount > 0 ? <span className="text-muted-foreground">({pendingCount} pending)</span> : null}
        </h2>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm capitalize",
                filter === f ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-accent",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading comments…</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nothing to review here.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-border p-4">
              <Avatar className="size-9">
                <MediaAvatarImage src={c.author?.avatar_url} />
                <AvatarFallback>{initials(c.author?.display_name ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {c.author?.display_name}{" "}
                  <span className="font-normal text-muted-foreground">{timeAgo(c.created_at)}</span>
                  {!c.approved ? (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                      Pending
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.body}</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">on “{c.video?.title}”</p>
              </div>
              <div className="flex gap-2">
                {c.approved ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approveMutation.mutate({ id: c.id, approved: false })}
                  >
                    <Undo2 className="mr-1 size-4" /> Hide
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => approveMutation.mutate({ id: c.id, approved: true })}>
                    <Check className="mr-1 size-4" /> Approve
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
