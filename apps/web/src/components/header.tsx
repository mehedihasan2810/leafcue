import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export default function Header() {
  return (
    <header className="border-border/70 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sprout className="size-4" />
          </span>
          <span>LeafCue</span>
        </Link>
        <nav className="flex items-center gap-5 text-muted-foreground text-sm">
          <a
            href="#privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </a>
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>
        </nav>
      </div>
    </header>
  );
}
