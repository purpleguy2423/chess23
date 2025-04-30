import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChessContext } from "@/context/ChessContext";

type GameStatusProps = {
  className?: string;
};

const GameStatus = ({ className }: GameStatusProps) => {
  const { gameState, capturedPieces, game } = useChessContext();
  
  // Get status text
  const getStatusText = () => {
    if (!gameState) return "Game not started";
    
    if (gameState.isCheckmate) {
      return gameState.winner === 'white' ? "White wins" : "Black wins";
    }
    
    if (gameState.isDraw || gameState.isStalemate) {
      return "Draw";
    }
    
    if (gameState.status === 'resigned') {
      return `${gameState.winner === 'white' ? 'White' : 'Black'} wins by resignation`;
    }
    
    return gameState.turn === 'w' ? "White to move" : "Black to move";
  };
  
  // Get badge color
  const getBadgeColor = () => {
    if (!gameState) return "bg-gray-100 text-gray-800";
    
    if (gameState.gameOver) {
      return "bg-red-100 text-red-800";
    }
    
    if (gameState.isCheck) {
      return "bg-yellow-100 text-yellow-800";
    }
    
    return "bg-green-100 text-green-800";
  };
  
  // Get the last few moves for each side
  const getRecentMoves = () => {
    if (!game) return { white: "", black: "" };
    
    const history = game.history();
    const whiteHistory = history.filter((_, i) => i % 2 === 0).slice(-3);
    const blackHistory = history.filter((_, i) => i % 2 === 1).slice(-3);
    
    return {
      white: whiteHistory.join(", "),
      black: blackHistory.join(", ")
    };
  };
  
  const recentMoves = getRecentMoves();
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Game Status</h2>
          <Badge className={getBadgeColor()}>
            {gameState?.isCheck && !gameState.gameOver ? "Check" : getStatusText()}
          </Badge>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Captured by White:</span>
            <div className="flex">
              {capturedPieces.white.map((piece, i) => (
                <span key={`white-capture-${i}`} className="text-lg font-chess ml-1">
                  {piece === 'P' ? '♟' : 
                   piece === 'N' ? '♞' : 
                   piece === 'B' ? '♝' : 
                   piece === 'R' ? '♜' : 
                   piece === 'Q' ? '♛' : ''}
                </span>
              ))}
              {capturedPieces.white.length === 0 && (
                <span className="text-gray-500">None</span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Captured by Black:</span>
            <div className="flex">
              {capturedPieces.black.map((piece, i) => (
                <span key={`black-capture-${i}`} className="text-lg font-chess ml-1">
                  {piece === 'P' ? '♙' : 
                   piece === 'N' ? '♘' : 
                   piece === 'B' ? '♗' : 
                   piece === 'R' ? '♖' : 
                   piece === 'Q' ? '♕' : ''}
                </span>
              ))}
              {capturedPieces.black.length === 0 && (
                <span className="text-gray-500">None</span>
              )}
            </div>
          </div>
          <div className="mt-3 text-sm">
            {recentMoves.white && (
              <div><span className="font-medium">White:</span> {recentMoves.white}</div>
            )}
            {recentMoves.black && (
              <div><span className="font-medium">Black:</span> {recentMoves.black}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameStatus;
