import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Mail, MessageCircle, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FALLBACK_ORIGIN = "https://u-tubee.lovable.app";

export function shareUrlFor(video: { id: string; is_short?: boolean }): string {
  const origin = typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;
  return video.is_short ? `${origin}/shorts?v=${video.id}` : `${origin}/watch/${video.id}`;
}

export function ShareDialog({
  open,
  onOpenChange,
  video,
  title = "Share this video",
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: { id: string; title: string; is_short?: boolean };
  title?: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => (open ? shareUrlFor(video) : ""), [open, video]);
  const text = `Watch “${video.title}” on Streamly`;

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy — select the link and copy manually");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: video.title, text, url });
        return;
      } catch {
        return;
      }
    }
    void copy();
  }

  const targets = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      label: "X",
      icon: Send,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Facebook",
      icon: Link2,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(video.title)}&body=${encodeURIComponent(`${text}\n${url}`)}`,
    },
  ];

  const embed = `<iframe src="${url}" width="560" height="315" frameborder="0" allowfullscreen title="${video.title}"></iframe>`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? "Anyone with the link can watch it."}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3">
          {targets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex w-20 flex-col items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <t.icon className="size-5" />
              </span>
              {t.label}
            </a>
          ))}
          <button
            onClick={() => void nativeShare()}
            className="flex w-20 flex-col items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <Share2 className="size-5" />
            </span>
            More
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-secondary p-2">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-9 border-0 bg-transparent text-xs" />
          <Button size="sm" className="rounded-full" onClick={() => void copy()}>
            {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div>
          <p className="text-xs font-medium text-foreground">Embed code</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Input readOnly value={embed} onFocus={(e) => e.currentTarget.select()} className="h-9 text-xs" />
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                void navigator.clipboard.writeText(embed);
                toast.success("Embed code copied");
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShareButton({
  video,
  className,
  variant = "secondary",
  label = "Share",
}: {
  video: { id: string; title: string; is_short?: boolean };
  className?: string;
  variant?: "secondary" | "ghost" | "default";
  label?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <Share2 className={label ? "mr-2 size-4" : "size-4"} /> {label}
      </Button>
      <ShareDialog open={open} onOpenChange={setOpen} video={video} />
    </>
  );
}
