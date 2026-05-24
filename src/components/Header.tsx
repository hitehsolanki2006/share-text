import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  return (
    <header className="sticky top-0 z-40 glass border-b border-glass-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary glow transition-transform group-hover:scale-105">
            <Lock className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Share<span className="text-gradient">Text</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-secondary" }}
          >
            Home
          </Link>
          <Link
            to="/how-it-works"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-secondary" }}
          >
            How It Works
          </Link>
          <button
            onClick={() => setLight((v) => !v)}
            className="ml-2 rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Toggle theme"
          >
            {light ? "☀" : "🌙"}
          </button>
        </nav>
      </div>
    </header>
  );
}
