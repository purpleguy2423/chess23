import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChessProvider } from "@/context/ChessContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Play from "@/pages/Play";
import Tutorial from "@/pages/Tutorial";
import Multiplayer from "@/pages/Multiplayer";
import Header from "@/components/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/play" component={Play} />
      <Route path="/tutorial" component={Tutorial} />
      <Route path="/multiplayer" component={Multiplayer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChessProvider>
          <Toaster />
          <div className="min-h-screen flex flex-col">
            <Header />
            <Router />
          </div>
        </ChessProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
