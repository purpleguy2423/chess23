import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChessContext } from "@/context/ChessContext";
import { useState, useEffect } from "react";

type MoveHistoryProps = {
  className?: string;
};

const MoveHistory = ({ className }: MoveHistoryProps) => {
  const { game } = useChessContext();
  const [history, setHistory] = useState<{ moveNumber: number, white: string, black: string }[]>([]);
  
  useEffect(() => {
    if (!game) return;
    
    // Get move history from chess.js
    const fullHistory = game.history({ verbose: true });
    const formattedHistory: { moveNumber: number, white: string, black: string }[] = [];
    
    for (let i = 0; i < fullHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = fullHistory[i]?.san || "";
      const blackMove = fullHistory[i + 1]?.san || "";
      
      formattedHistory.push({
        moveNumber,
        white: whiteMove,
        black: blackMove
      });
    }
    
    // If last white move has no corresponding black move yet
    if (fullHistory.length % 2 !== 0 && formattedHistory.length > 0) {
      const lastEntry = formattedHistory[formattedHistory.length - 1];
      formattedHistory[formattedHistory.length - 1] = {
        ...lastEntry,
        black: "..."
      };
    }
    
    setHistory(formattedHistory);
  }, [game]);
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold">Move History</h2>
        <ScrollArea className="mt-2 h-48">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">#</th>
                <th className="text-left pb-2">White</th>
                <th className="text-left pb-2">Black</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">
                    No moves yet
                  </td>
                </tr>
              ) : (
                history.map((move, index) => (
                  <tr 
                    key={move.moveNumber} 
                    className={`hover:bg-gray-100 ${index === history.length - 1 ? 'bg-gray-100' : ''}`}
                  >
                    <td className="py-1">{move.moveNumber}</td>
                    <td className="py-1 px-1">{move.white}</td>
                    <td className="py-1 px-1">
                      {move.black === "..." ? (
                        <span className="font-medium">...</span>
                      ) : (
                        move.black
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MoveHistory;
