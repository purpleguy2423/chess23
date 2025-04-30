import { useState, useEffect } from "react";
import { useChessContext } from "@/context/ChessContext";
import GameModeTabs from "@/components/GameModeTabs";
import ChessBoard from "@/components/ChessBoard";
import GameControls from "@/components/GameControls";
import MoveHistory from "@/components/MoveHistory";
import GameStatus from "@/components/GameStatus";
import { useChessGame } from "@/hooks/useChessGame";
import { findAIMove } from "@/lib/chessEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Play = () => {
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  
  const {
    chess,
    gameState,
    makeMove,
    aiDifficulty,
    setAiDifficulty,
    newGame
  } = useChessContext();

  // Start a new AI game with selected difficulty
  const startNewAIGame = () => {
    setAiDifficulty(difficulty);
    newGame({ aiGame: true, aiDifficulty: difficulty });
    setGameStarted(true);
    setShowDifficultyDialog(false);
  };

  // Handle "Play vs Computer" tab click
  const handleNewAIGame = () => {
    setShowDifficultyDialog(true);
  };

  return (
    <main className="container mx-auto p-4">
      <GameModeTabs activeTab="ai" />

      {!gameStarted && !showDifficultyDialog ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Play Against Computer</h2>
          <p className="mb-8 max-w-lg">
            Challenge our chess AI opponent with adjustable difficulty levels.
            Perfect for players of all skill levels.
          </p>
          <Button 
            className="bg-accent text-white hover:bg-accent/90 px-8 py-3 text-lg"
            onClick={handleNewAIGame}
          >
            Start New Game
          </Button>
        </div>
      ) : showDifficultyDialog ? (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Select AI Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Difficulty: {difficulty}</span>
                  <span className="font-medium">
                    {difficulty === 1 ? "Beginner" : 
                     difficulty === 2 ? "Easy" :
                     difficulty === 3 ? "Intermediate" :
                     difficulty === 4 ? "Advanced" : "Expert"}
                  </span>
                </div>
                <Slider
                  value={[difficulty]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) => setDifficulty(value[0])}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Easier</span>
                  <span>Harder</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDifficultyDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-accent text-white hover:bg-accent/90"
                  onClick={startNewAIGame}
                >
                  Start Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="main-container flex flex-col lg:flex-row gap-6">
          <ChessBoard 
            playerName="You"
            opponentName={`Computer (${
              aiDifficulty === 1 ? "Beginner" : 
              aiDifficulty === 2 ? "Easy" :
              aiDifficulty === 3 ? "Intermediate" :
              aiDifficulty === 4 ? "Advanced" : "Expert"
            })`}
            opponentRating={1000 + (aiDifficulty * 100)}
          />
          
          <div className="lg:w-1/3 space-y-4">
            <GameControls onNewGame={handleNewAIGame} />
            <MoveHistory />
            <GameStatus />
          </div>
        </div>
      )}
    </main>
  );
};

export default Play;
