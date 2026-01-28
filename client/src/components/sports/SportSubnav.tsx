import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { EspnSportKey } from "@/lib/espn";
import { getSportConfig } from "@/lib/espn";

export function SportSubnav({ sportKey }: { sportKey: EspnSportKey }) {
  const cfg = getSportConfig(sportKey);
  const [location] = useLocation();

  if (!cfg) return null;

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container px-4 md:px-6">
        <div className="flex items-center gap-6 overflow-x-auto py-3">
          {cfg.scoresTabs.map((t) => {
            const href = t.href(sportKey);
            const active = location === href;
            return (
              <Link
                key={t.key}
                href={href}
                data-testid={`link-sporttab-${sportKey}-${t.key}`}
                className={cn(
                  "whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
