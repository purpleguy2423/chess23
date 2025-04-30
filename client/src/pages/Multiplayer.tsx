import { useState, useEffect } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import GameModeTabs from "@/components/GameModeTabs";
import ChessBoard from "@/components/ChessBoard";
import GameControls from "@/components/GameControls";
import MoveHistory from "@/components/MoveHistory";
import GameStatus from "@/components/GameStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronRight, Users, Copy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Multiplayer = () => {
  const [gameAction, setGameAction] = useState<'create' | 'join' | null>(null);
  const [gameIdToJoin, setGameIdToJoin] = useState('');
  const [timeControl, setTimeControl] = useState(10); // 10 minutes
  
  const { toast } = useToast();
  const {
    status,
    gameId,
    playerColor,
    gameState,
    chess,
    selectedPiece,
    legalMoves,
    createGame,
    joinGame,
    makeMove,
    resign,
    selectPiece
  } = useMultiplayer();

  // Handle game creation
  const handleCreateGame = async () => {
    const id = await createGame();
    if (id) {
      setGameAction(null);
    }
  };

  // Handle joining a game
  const handleJoinGame = () => {
    const id = parseInt(gameIdToJoin);
    if (isNaN(id)) {
      toast({
        title: "Invalid Game ID",
        description: "Please enter a valid game ID.",
        variant: "destructive",
      });
      return;
    }
    
    joinGame(id);
    setGameAction(null);
  };

  // Handle copy game ID to clipboard
  const handleCopyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId.toString());
      toast({
        title: "Copied!",
        description: "Game ID copied to clipboard.",
        variant: "default",
      });
    }
  };

  // Check if game is active
  const isGameActive = status === 'playing' && gameState && !gameState.gameOver;

  return (
    <main className="container mx-auto p-4">
      <GameModeTabs activeTab="multiplayer" />

      {status === 'disconnected' && !gameAction ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Multiplayer Chess</h2>
          <p className="mb-8 max-w-lg">
            Play chess online with friends or random opponents in real-time.
            Create a new game or join an existing one using a game ID.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              className="bg-accent text-white hover:bg-accent/90 px-8 py-3 text-lg"
              onClick={() => setGameAction('create')}
            >
              Create New Game <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg"
              onClick={() => setGameAction('join')}
            >
              Join Game <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : gameAction === 'create' ? (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>
              Set up a new multiplayer chess game and invite a friend to play.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Control (minutes per player)</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={timeControl}
                  onChange={(e) => setTimeControl(parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setGameAction(null)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-accent text-white hover:bg-accent/90"
              onClick={handleCreateGame}
            >
              Create Game
            </Button>
          </CardFooter>
        </Card>
      ) : gameAction === 'join' ? (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>
              Enter a game ID to join an existing multiplayer chess game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Game ID</label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Enter game ID"
                  value={gameIdToJoin}
                  onChange={(e) => setGameIdToJoin(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setGameAction(null)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-accent text-white hover:bg-accent/90"
              onClick={handleJoinGame}
            >
              Join Game
            </Button>
          </CardFooter>
        </Card>
      ) : status === 'waiting' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Opponent</h2>
          <div className="mb-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="mb-4">Share this game ID with your opponent:</p>
            <div className="flex items-center justify-center gap-2">
              <Card className="px-4 py-2 bg-gray-100 border-gray-300">
                <span className="text-lg font-mono">{gameId}</span>
              </Card>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyGameId}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
        </div>
      ) : isGameActive ? (
        <div className="main-container flex flex-col lg:flex-row gap-6">
          <ChessBoard 
            playerName="You"
            opponentName="Opponent"
          />
          
          <div className="lg:w-1/3 space-y-4">
            <GameControls disableDifficulty={true} />
            <MoveHistory />
            <GameStatus />
            
            {gameId && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Game ID: </span>
                    <span className="font-mono">{gameId}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyGameId}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : gameState?.gameOver ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Game Over</h2>
          <Card className="max-w-md w-full mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                {gameState.winner === 'white' ? "White wins" : 
                 gameState.winner === 'black' ? "Black wins" : "Draw"}
              </h3>
              <p className="mb-4 text-gray-600">
                {gameState.status === 'checkmate' ? "By checkmate" :
                 gameState.status === 'stalemate' ? "By stalemate" :
                 gameState.status === 'draw' ? "By draw" :
                 gameState.status === 'resigned' ? "By resignation" : "Game ended"}
              </p>
              <Button 
                className="bg-accent text-white hover:bg-accent/90 w-full"
                onClick={() => window.location.reload()}
              >
                Back to Lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Connecting to game...</p>
        </div>
      )}
    </main>
  );
};

export default Multiplayer;
