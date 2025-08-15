import * as React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const nav = [
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-border/40 bg-background/80">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="Home">
            <div className="h-10 w-10 rounded-md bg-brand-primary grid place-items-center">
              <span className="text-white font-semibold text-lg leading-none">W</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="text-base text-foreground hover:text-primary transition-colors duration-200"
              >
                {n.label}
              </a>
            ))}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 px-6 rounded-md text-sm font-medium border-input"
              asChild
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button className="h-10 px-6 rounded-md text-sm font-medium bg-brand-primary">
              Get Started
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden ml-1 h-10 w-10 grid place-items-center rounded-md text-foreground hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur px-4 pb-4">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-foreground hover:text-primary transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              className="h-10 px-6 rounded-md text-sm font-medium flex-1 border-input"
              asChild
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button className="h-10 px-6 rounded-md text-sm font-medium flex-1 bg-brand-primary">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}