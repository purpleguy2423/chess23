import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, RotateCcw, RefreshCcwDot, Flag } from "lucide-react";
import { useChessContext } from "@/context/ChessContext";

type GameControlsProps = {
  onNewGame?: () => void;
  disableDifficulty?: boolean;
};

const GameControls = ({ onNewGame, disableDifficulty = false }: GameControlsProps) => {
  const { 
    aiDifficulty, 
    showLegalMoves, 
    suggestMove, 
    setAiDifficulty, 
    setShowLegalMoves, 
    setSuggestMove,
    flipBoard, 
    takeBackMove, 
    resign,
    resetGame
  } = useChessContext();

  const handleNewGame = () => {
    resetGame();
    if (onNewGame) onNewGame();
  };

  const handleDifficultyChange = (value: number[]) => {
    setAiDifficulty(value[0]);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Game Controls</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bg-accent text-white hover:bg-accent/90 flex items-center justify-center"
            onClick={handleNewGame}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> New Game
          </Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
            onClick={takeBackMove}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Take Back
          </Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
            onClick={flipBoard}
          >
            <RefreshCcwDot className="mr-2 h-4 w-4" /> Flip Board
          </Button>
          <Button 
            variant="outline"
            className="border border-primary text-primary hover:bg-gray-100 flex items-center justify-center"
            onClick={resign}
          >
            <Flag className="mr-2 h-4 w-4" /> Resign
          </Button>
        </div>
        
        {!disableDifficulty && (
          <div className="mt-4">
            <Label className="block text-sm font-medium mb-1">Computer Difficulty</Label>
            <div className="flex justify-between items-center">
              <span className="text-sm">Easy</span>
              <Slider 
                value={[aiDifficulty]} 
                min={1} 
                max={5} 
                step={1} 
                className="flex-grow mx-2"
                onValueChange={handleDifficultyChange}
              />
              <span className="text-sm">Hard</span>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <Label className="block text-sm font-medium mb-1">Hints</Label>
          <div className="flex items-center">
            <Checkbox 
              id="show-legal-moves" 
              checked={showLegalMoves}
              onCheckedChange={(checked) => setShowLegalMoves(checked as boolean)}
              className="h-4 w-4 rounded accent-accent"
            />
            <Label htmlFor="show-legal-moves" className="ml-2 text-sm">Show legal moves</Label>
          </div>
          <div className="flex items-center mt-1">
            <Checkbox 
              id="suggest-move" 
              checked={suggestMove}
              onCheckedChange={(checked) => setSuggestMove(checked as boolean)}
              className="h-4 w-4 rounded accent-accent"
            />
            <Label htmlFor="suggest-move" className="ml-2 text-sm">Suggest best move</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameControls;
