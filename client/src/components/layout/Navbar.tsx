import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Mic, Trophy, Newspaper, User, ChevronDown } from "lucide-react";
import { SportMegaMenu } from "@/components/layout/SportMegaMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SPORTS } from "@/lib/espn";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const navItems = [
    { label: "Home", href: "/", icon: null },
    { label: "Podcast", href: "/podcast", icon: Mic },
    { label: "News", href: "/news", icon: Newspaper },
    { label: "Scores", href: "/scores", icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" data-testid="link-logo">
          <span className="font-heading text-2xl font-bold uppercase tracking-tighter text-foreground italic">
            The <span className="text-primary">Chewth</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          <SportMegaMenu />
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary uppercase tracking-wide",
                location === item.href ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Quick Sport Switcher */}
          {location.startsWith("/sport/") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="uppercase font-bold tracking-wider text-xs"
                  data-testid="button-sport-switcher"
                >
                  <Trophy className="h-3.5 w-3.5 mr-1.5" />
                  Switch Sport
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {SPORTS.map((sport) => (
                  <DropdownMenuItem key={sport.key} asChild>
                    <Link
                      href={`/sport/${sport.key}/scores`}
                      className="cursor-pointer uppercase font-bold tracking-wide"
                      data-testid={`dropdown-sport-${sport.key}`}
                    >
                      {sport.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <Link href="/admin" data-testid="link-admin">
            <Button data-testid="button-admin" variant="ghost" size="icon" className="hover:text-primary">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col space-y-4">
            <Link
              href="/scores"
              data-testid="link-mobile-sports"
              className={cn(
                "flex items-center space-x-2 text-lg font-medium transition-colors hover:text-primary",
                location === "/scores" ? "text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy className="h-5 w-5" />
              <span>Sports Hub</span>
            </Link>

            {navItems.filter((i) => i.href !== "/scores").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-mobile-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center space-x-2 text-lg font-medium transition-colors hover:text-primary",
                  location === item.href ? "text-primary" : "text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/admin"
              data-testid="link-mobile-admin"
              className="flex items-center space-x-2 text-lg font-medium hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
