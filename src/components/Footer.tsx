import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-glass-border mt-24">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Powered by zero-knowledge encryption</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition">GitHub</a>
          <Link to="/how-it-works" className="hover:text-foreground transition">Privacy</Link>
          <Link to="/how-it-works" className="hover:text-foreground transition">About</Link>
        </div>
      </div>
    </footer>
  );
}
