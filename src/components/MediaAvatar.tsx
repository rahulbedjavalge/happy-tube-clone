import { AvatarImage } from "@/components/ui/avatar";
import { useMediaUrl } from "@/lib/storage";

/** Avatar image that resolves uploaded storage refs to signed URLs. */
export function MediaAvatarImage({ src, alt = "" }: { src: string | null | undefined; alt?: string }) {
  const resolved = useMediaUrl(src);
  return <AvatarImage src={resolved ?? undefined} alt={alt} />;
}
