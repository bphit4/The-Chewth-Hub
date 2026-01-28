import { SPORTS } from "@/lib/espn";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function SportMegaMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="button-sports-menu"
          variant="ghost"
          className="uppercase tracking-wide font-bold"
        >
          Sports <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {SPORTS.map((s) => (
          <DropdownMenuItem key={s.key} asChild>
            <Link href={`/sport/${s.key}/scores`}>
              <a data-testid={`link-sport-${s.key}`} className="w-full">
                {s.label}
              </a>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
