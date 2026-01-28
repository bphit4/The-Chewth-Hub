import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { EspnSportKey } from "@/lib/espn";
import { getSportConfig } from "@/lib/espn";

export function SportSubnav({ sportKey }: { sportKey: EspnSportKey }) {
  const cfg = getSportConfig(sportKey);
  const [location] = useLocation();

  if (!cfg) return null;

  // Keep all tabs but rename "Home" to "Hub" for clarity
  const tabs = cfg.scoresTabs.map(t => 
    t.key === "home" ? { ...t, label: "Hub" } : t
  );

  return (
    <div className="sticky top-12 z-40 border-b border-border/50 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-0 -mb-px">
          {tabs.map((t) => {
            const href = t.href(sportKey);
            const active = location === href;
            return (
              <Link
                key={t.key}
                href={href}
                data-testid={`link-sporttab-${sportKey}-${t.key}`}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2",
                  active 
                    ? "text-primary border-primary" 
                    : "text-muted-foreground hover:text-foreground border-transparent"
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
