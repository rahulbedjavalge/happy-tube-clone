import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Menu,
  Search,
  ThumbsUp,
  History,
  ListVideo,
  Upload,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Play,
  Plus,
  Clapperboard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MediaAvatarImage } from "@/components/MediaAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/queries";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shorts", label: "Shorts", icon: Clapperboard },
  { to: "/subscriptions", label: "Subscriptions", icon: ListVideo },
  { to: "/history", label: "History", icon: History },
  { to: "/liked", label: "Liked videos", icon: ThumbsUp },
  { to: "/channels", label: "Channels", icon: Users },
  { to: "/studio", label: "Your studio", icon: Upload },

] as const;

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
          className={cn(
            "flex items-center rounded-lg text-sm text-foreground transition-colors hover:bg-accent",
            collapsed ? "flex-col gap-1 px-1 py-4 text-[10px]" : "gap-5 px-3 py-2.5",
          )}
        >
          <item.icon className="size-5 shrink-0" />
          <span className={cn(collapsed && "text-center leading-tight")}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const searchParams = useRouterState({ select: (s) => s.location.search as { q?: string } });
  const [query, setQuery] = useState(searchParams.q ?? "");
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-2 sm:px-4">
        <Button variant="ghost" size="icon" aria-label="Toggle menu" onClick={() => setCollapsed((c) => !c)}>
          <Menu className="size-5" />
        </Button>
        <Link to="/" className="flex items-center gap-1.5 pr-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Play className="size-4 fill-primary-foreground text-primary-foreground" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">Happy Tube Clone</span>
        </Link>

        <form
          className="mx-auto flex w-full max-w-xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/results", search: { q: query, sort: "newest" } });
          }}
        >
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search videos"
              className="h-10 rounded-full pl-4 pr-10"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <Search className="size-4" />
            </button>
          </div>
        </form>

        <ThemeToggle />

        {user ? (
          <Button asChild variant="outline" className="ml-1 hidden rounded-full sm:inline-flex">
            <Link to="/studio" search={{ upload: true }}>
              <Plus className="mr-1.5 size-4" /> Upload
            </Link>
          </Button>
        ) : null}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Account menu" className="ml-1 rounded-full">
                <Avatar className="size-8">
                  <MediaAvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{initials(profile?.display_name ?? user.email ?? "U")}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/channel/$handle" params={{ handle: profile?.handle ?? "" }}>
                  <UserIcon className="mr-2 size-4" /> Your channel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/studio" search={{ upload: true }}>
                  <Plus className="mr-2 size-4" /> Upload video
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/studio" search={{ upload: false }}>
                  <Upload className="mr-2 size-4" /> Studio
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="mr-2 size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="outline" className="ml-1 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </header>

      <div className="flex">
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-border md:block",
            collapsed ? "w-20" : "w-56",
          )}
        >
          <SidebarNav collapsed={collapsed} />
        </aside>
        <main className={cn("min-w-0 flex-1 px-4 py-5", wide ? "" : "mx-auto max-w-[1800px]")}>{children}</main>
      </div>
    </div>
  );
}
