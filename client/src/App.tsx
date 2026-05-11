import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BoardAuthProvider } from "@/components/board/BoardAuthProvider";

// Pages
import Home from "@/pages/Home";
import Podcast from "@/pages/Podcast";
import News from "@/pages/News";
import Scores from "@/pages/Scores";
import ArticleDetail from "@/pages/ArticleDetail";
import EpisodeDetail from "@/pages/EpisodeDetail";
import SportScores from "@/pages/SportScores";
import GameDetail from "@/pages/GameDetail";
import SportHome from "@/pages/SportHome";
import SportStandings from "@/pages/SportStandings";
import SportTeams from "@/pages/SportTeams";
import SportSchedule from "@/pages/SportSchedule";
import SportNews from "@/pages/SportNews";
import SportOdds from "@/pages/SportOdds";
import SportStats from "@/pages/SportStats";
import SportRankings from "@/pages/SportRankings";
import TeamDetail from "@/pages/TeamDetail";
import AthleteDetail from "@/pages/AthleteDetail";
import SportPlayoffs from "@/pages/SportPlayoffs";
import SportBracket from "@/pages/SportBracket";
import SportTransfer from "@/pages/SportTransfer";
import Board from "@/pages/Board";
import BoardThread from "@/pages/BoardThread";
import BoardAdmin from "@/pages/BoardAdmin";

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col font-sans text-foreground bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/podcast" component={Podcast} />
          <Route path="/podcast/:id" component={EpisodeDetail} />
          <Route path="/news" component={News} />
          <Route path="/news/:id" component={ArticleDetail} />
          <Route path="/scores" component={Scores} />
          <Route path="/board" component={Board} />
          <Route path="/board/admin" component={BoardAdmin} />
          <Route path="/board/:threadId" component={BoardThread} />

          {/* ESPN-like sport hubs */}
          <Route path="/sport/:sport/scores" component={SportScores} />
          <Route path="/sport/:sport/game/:id" component={GameDetail} />
          <Route path="/sport/:sport/standings" component={SportStandings} />
          <Route path="/sport/:sport/standings/:level" component={SportStandings} />
          <Route path="/sport/:sport/stats" component={SportStats} />
          <Route path="/sport/:sport/teams" component={SportTeams} />
          <Route path="/sport/:sport/team/:teamId" component={TeamDetail} />
          <Route path="/sport/:sport/athlete/:athleteId" component={AthleteDetail} />
          <Route path="/sport/:sport/schedule" component={SportSchedule} />
          <Route path="/sport/:sport/news" component={SportNews} />
          <Route path="/sport/:sport/odds" component={SportOdds} />
          <Route path="/sport/:sport/rankings" component={SportRankings} />
          <Route path="/sport/:sport/playoffs" component={SportPlayoffs} />
          <Route path="/sport/:sport/bracket" component={SportBracket} />
          <Route path="/sport/:sport/transfer" component={SportTransfer} />
          <Route path="/sport/:sport" component={SportHome} />

          <Route path="/admin" component={BoardAdmin} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BoardAuthProvider>
          <Router />
        </BoardAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
