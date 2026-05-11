import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Mic, Newspaper, User } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPORTS } from "@/lib/espn";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const isOnSportPage = location.startsWith("/sport/");

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-secondary border-b border-white/5">
      <div className="container flex h-12 items-center px-4 gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" data-testid="link-logo">
          <span className="font-heading text-lg font-bold uppercase tracking-tighter text-white">
            The <span className="text-primary">Chewth</span>
          </span>
        </Link>

        {/* Sport Tabs - ESPN Style */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
          {SPORTS.map((sport) => {
            const isActive = location.startsWith(`/sport/${sport.key}`);
            return (
              <Link
                key={sport.key}
                href={`/sport/${sport.key}/scores`}
                data-testid={`link-sport-${sport.key}`}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors rounded",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {sport.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Right side nav */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <Link
            href="/"
            data-testid="link-nav-home"
            className={cn(
              "text-xs font-bold uppercase tracking-wide transition-colors",
              location === "/" ? "text-primary" : "text-white/70 hover:text-white"
            )}
          >
            Home
          </Link>
          <Link
            href="/podcast"
            data-testid="link-nav-podcast"
            className={cn(
              "text-xs font-bold uppercase tracking-wide transition-colors",
              location === "/podcast" ? "text-primary" : "text-white/70 hover:text-white"
            )}
          >
            Podcast
          </Link>
          <Link
            href="/news"
            data-testid="link-nav-news"
            className={cn(
              "text-xs font-bold uppercase tracking-wide transition-colors",
              location === "/news" ? "text-primary" : "text-white/70 hover:text-white"
            )}
          >
            News
          </Link>
          <Link
            href="/board"
            data-testid="link-nav-board"
            className={cn(
              "text-xs font-bold uppercase tracking-wide transition-colors",
              location.startsWith("/board") ? "text-primary" : "text-white/70 hover:text-white"
            )}
          >
            Board
          </Link>
          
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <Link href="/board/admin" data-testid="link-admin" title="Board account">
            <Button data-testid="button-admin" variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white/80 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-secondary px-4 py-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col space-y-2">
            <div className="text-xs text-white/50 font-bold uppercase mb-2">Sports</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SPORTS.map((sport) => (
                <Link
                  key={sport.key}
                  href={`/sport/${sport.key}/scores`}
                  data-testid={`link-mobile-${sport.key}`}
                  className={cn(
                    "px-3 py-2 text-sm font-bold uppercase rounded transition-colors",
                    location.startsWith(`/sport/${sport.key}`) 
                      ? "bg-primary text-white" 
                      : "text-white/70 hover:bg-white/10"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {sport.label}
                </Link>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-3 flex flex-col space-y-2">
              <Link
                href="/"
                data-testid="link-mobile-home"
                className="text-white/70 hover:text-white text-sm font-bold uppercase"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/podcast"
                data-testid="link-mobile-podcast"
                className="text-white/70 hover:text-white text-sm font-bold uppercase"
                onClick={() => setIsOpen(false)}
              >
                Podcast
              </Link>
              <Link
                href="/news"
                data-testid="link-mobile-news"
                className="text-white/70 hover:text-white text-sm font-bold uppercase"
                onClick={() => setIsOpen(false)}
              >
                News
              </Link>
              <Link
                href="/board"
                data-testid="link-mobile-board"
                className="text-white/70 hover:text-white text-sm font-bold uppercase"
                onClick={() => setIsOpen(false)}
              >
                Board
              </Link>
              <Link
                href="/board/admin"
                data-testid="link-mobile-admin"
                className="text-white/70 hover:text-white text-sm font-bold uppercase"
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
