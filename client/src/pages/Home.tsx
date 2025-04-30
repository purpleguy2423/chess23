import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, MonitorPlay, Users, BookOpen } from "lucide-react";

const Home = () => {
  return (
    <main className="container mx-auto p-4 flex-1 flex flex-col">
      <section className="py-12 md:py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Chess Master</h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Play chess online against AI opponents, challenge friends in multiplayer,
          or improve your skills with our interactive tutorials.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white">
            <Link href="/play">
              Play Now <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Link href="/tutorial">
              Learn Chess <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
              <MonitorPlay className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Play Against AI</CardTitle>
            <CardDescription>
              Challenge our chess AI with adjustable difficulty levels for players of all skill levels.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Multiple difficulty levels</li>
              <li>Practice strategies risk-free</li>
              <li>Analyze your moves</li>
              <li>Play anytime, anywhere</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/play">Play vs Computer</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Multiplayer Chess</CardTitle>
            <CardDescription>
              Challenge friends or random opponents to a game of chess in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Real-time multiplayer</li>
              <li>Challenge friends</li>
              <li>Track your performance</li>
              <li>Chat with opponents</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/multiplayer">Play Online</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Interactive Tutorials</CardTitle>
            <CardDescription>
              Learn chess from the ground up with our interactive step-by-step tutorials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Learn piece movements</li>
              <li>Master basic strategies</li>
              <li>Practice key tactics</li>
              <li>Progress tracking</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/tutorial">Start Learning</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
};

export default Home;
