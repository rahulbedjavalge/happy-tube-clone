import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />;

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue.</p>
        <Button asChild className="mt-5 rounded-full">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
