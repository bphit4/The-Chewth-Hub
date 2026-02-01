import { ScoreTicker } from "@/components/ui/ScoreTicker";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ARTICLES, PODCAST_EPISODES } from "@/lib/mockData";
import { ArrowRight, Play, Calendar, User, TrendingUp, Flame, Swords } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const latestEpisode = PODCAST_EPISODES[0];
  const featuredArticles = ARTICLES.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <ScoreTicker />
      
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 overflow-hidden bg-secondary">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/hero-bg.png" 
            alt="Studio Background" 
            className="h-full w-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8 animate-in slide-in-from-left-10 duration-700">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-bold uppercase tracking-wider border border-primary/20 backdrop-blur-sm">
                New Episode Out Now
              </div>
              <h1 className="text-5xl font-heading font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase italic leading-[0.9]">
                Unfiltered.<br/>
                <span className="text-primary">Unapologetic.</span><br/>
                The Chewth.
              </h1>
              <p className="max-w-[600px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-light">
                Breaking down the biggest stories in NFL, NBA, MMA, and College Sports with zero corporate filter.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/podcast">
                  <Button size="lg" className="h-12 px-8 text-base font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-white rounded-none skew-x-[-10deg]">
                    <span className="skew-x-[10deg] flex items-center gap-2">
                      <Play className="h-5 w-5 fill-current" /> Listen Now
                    </span>
                  </Button>
                </Link>
                <Link href="/news">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base font-bold uppercase tracking-wide border-white/20 hover:bg-white/10 text-white rounded-none skew-x-[-10deg]">
                     <span className="skew-x-[10deg]">Read Latest</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:ml-auto animate-in slide-in-from-right-10 duration-1000 delay-200">
               <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-30"></div>
                  <AudioPlayer 
                    title={latestEpisode.title} 
                    episodeNumber={latestEpisode.id.replace('ep-', 'Episode ')}
                    duration={latestEpisode.duration}
                  />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed / Headlines */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-heading font-bold tracking-tight md:text-5xl uppercase italic text-secondary">
                Live <span className="text-primary-foreground bg-primary px-2">Feed</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                ESPN-style streams: quick jump into a sport, then browse Scores, News, Standings, Stats and more.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/sport/nfl/scores"><Button data-testid="button-jump-nfl" className="gap-2"><Swords className="h-4 w-4" /> NFL</Button></Link>
              <Link href="/sport/ncaaf/scores"><Button data-testid="button-jump-ncaaf" variant="outline" className="gap-2"><Flame className="h-4 w-4" /> CFB</Button></Link>
              <Link href="/sport/nba/scores"><Button data-testid="button-jump-nba" variant="outline" className="gap-2"><TrendingUp className="h-4 w-4" /> NBA</Button></Link>
              <Link href="/news"><Button data-testid="button-jump-news" variant="link" className="text-primary font-bold uppercase tracking-widest group">All Headlines <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`}>
                <Card className="group overflow-hidden border-none shadow-none bg-transparent cursor-pointer">
                  <div className="aspect-[16/9] overflow-hidden rounded-xl mb-4 relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-primary text-white hover:bg-primary border-none text-xs font-bold uppercase tracking-wider rounded-sm">
                        {article.category}
                      </Badge>
                    </div>
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {article.date}</span>
                      <span className="flex items-center"><User className="mr-1 h-3 w-3" /> {article.author}</span>
                    </div>
                    <h3 className="font-heading text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="w-full py-24 bg-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <TrophyIcon className="w-96 h-96" />
        </div>
        <div className="container px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-4xl font-heading font-bold text-white mb-6 uppercase italic">Join The Squad</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-lg">
            Get the latest episodes, breaking news, and exclusive betting tips delivered straight to your inbox every Friday.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wide">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
