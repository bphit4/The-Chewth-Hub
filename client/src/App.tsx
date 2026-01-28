import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Pages
import Home from "@/pages/Home";
import Podcast from "@/pages/Podcast";
import News from "@/pages/News";
import Scores from "@/pages/Scores";
import Admin from "@/pages/Admin";
import ArticleDetail from "@/pages/ArticleDetail";
import EpisodeDetail from "@/pages/EpisodeDetail";
import SportScores from "@/pages/SportScores";
import GameDetail from "@/pages/GameDetail";

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col font-sans text-foreground bg-background">
      {!isAdmin && <Navbar />}
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/podcast" component={Podcast} />
          <Route path="/podcast/:id" component={EpisodeDetail} />
          <Route path="/news" component={News} />
          <Route path="/news/:id" component={ArticleDetail} />
          <Route path="/scores" component={Scores} />

          {/* ESPN-like sport hubs */}
          <Route path="/sport/:sport/scores" component={SportScores} />
          <Route path="/sport/:sport/game/:id" component={GameDetail} />

          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
