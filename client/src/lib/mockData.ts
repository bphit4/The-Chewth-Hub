import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
export interface PodcastEpisode {
  id: string;
  title: string;
  date: string;
  duration: string;
  description: string;
  imageUrl: string;
  spotifyLink?: string;
  appleLink?: string;
  youtubeLink?: string;
  featured: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML content or rich text
  author: string;
  date: string;
  category: 'NFL' | 'NBA' | 'CFB' | 'CBB' | 'MLB' | 'MMA';
  imageUrl: string;
  tags: string[];
}

export interface Score {
  id: string;
  league: 'NFL' | 'NBA' | 'MLB' | 'CFB' | 'CBB' | 'MMA';
  status: 'Live' | 'Final' | 'Scheduled';
  time?: string;
  homeTeam: string;
  homeScore?: number;
  homeLogo?: string;
  awayTeam: string;
  awayScore?: number;
  awayLogo?: string;
}

// --- Mock Data ---

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: "ep-101",
    title: "Ep 101: The Playoff Picture & UFC 300 Preview",
    date: "Oct 15, 2025",
    duration: "1h 15m",
    description: "The guys break down the chaotic college football weekend, discuss the latest NFL trades, and give their early predictions for the UFC 300 main card. Special guest appearance by former lineman John Doe.",
    imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=800&auto=format&fit=crop&q=60",
    spotifyLink: "#",
    appleLink: "#",
    youtubeLink: "#",
    featured: true,
  },
  {
    id: "ep-100",
    title: "Ep 100: Century Mark! NBA Season Kickoff",
    date: "Oct 10, 2025",
    duration: "1h 05m",
    description: "We hit 100 episodes! To celebrate, we're doing a deep dive into the upcoming NBA season. Who are the real contenders? Plus, MLB playoff reactions.",
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=60",
    spotifyLink: "#",
    featured: false,
  },
  {
    id: "ep-99",
    title: "Ep 99: Week 5 Upsets & Heisman Watch",
    date: "Oct 3, 2025",
    duration: "58m",
    description: "Alabama goes down! We react to the massive upset in the SEC. Also, is the Heisman race already over? The crew debates.",
    imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format&fit=crop&q=60",
    spotifyLink: "#",
    featured: false,
  },
];

export const ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Why the 12-Team Playoff Changes Everything",
    excerpt: "The new college football playoff format has created more meaningful games in November than ever before.",
    content: "<p>The expansion to a 12-team playoff was controversial, but the results speak for themselves...</p>",
    author: "Mike 'The Mouth'",
    date: "Oct 16, 2025",
    category: "CFB",
    imageUrl: "https://images.unsplash.com/photo-1611004696515-343542289c09?w=800&auto=format&fit=crop&q=60",
    tags: ["Playoffs", "NCAA", "Analysis"],
  },
  {
    id: "art-2",
    title: "Rookie QBs: Who is Surviving the First Month?",
    excerpt: "We grade the top rookie quarterbacks after their first four starts in the NFL.",
    content: "<p>It's been a rough start for some, but others are shining...</p>",
    author: "Sarah Stats",
    date: "Oct 14, 2025",
    category: "NFL",
    imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&auto=format&fit=crop&q=60",
    tags: ["NFL", "Draft", "Rookies"],
  },
  {
    id: "art-3",
    title: "MMA Fight Night: Main Event Breakdown",
    excerpt: "A tactical look at this weekend's striker vs. grappler matchup.",
    content: "<p>Styles make fights, and this one is a classic clash...</p>",
    author: "Dan Combat",
    date: "Oct 12, 2025",
    category: "MMA",
    imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&auto=format&fit=crop&q=60",
    tags: ["MMA", "Preview"],
  },
  {
    id: "art-4",
    title: "NBA Power Rankings: Preseason Edition",
    excerpt: "The defending champs stay on top, but the West is looking scary.",
    content: "<p>With trades settling down, here is where everyone stands...</p>",
    author: "Sarah Stats",
    date: "Oct 08, 2025",
    category: "NBA",
    imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format&fit=crop&q=60",
    tags: ["NBA", "Rankings"],
  },
];

export const SCORES: Score[] = [
  {
    id: "s-1",
    league: "NFL",
    status: "Final",
    homeTeam: "KC",
    homeScore: 31,
    awayTeam: "BUF",
    awayScore: 28,
  },
  {
    id: "s-2",
    league: "NFL",
    status: "Live",
    time: "Q3 12:45",
    homeTeam: "PHI",
    homeScore: 17,
    awayTeam: "DAL",
    awayScore: 10,
  },
  {
    id: "s-3",
    league: "NBA",
    status: "Scheduled",
    time: "7:00 PM",
    homeTeam: "BOS",
    awayTeam: "NYK",
  },
  {
    id: "s-4",
    league: "MLB",
    status: "Final",
    homeTeam: "LAD",
    homeScore: 5,
    awayTeam: "NYY",
    awayScore: 2,
  },
];
