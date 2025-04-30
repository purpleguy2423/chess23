import { useRef, useState, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useChessContext } from "@/context/ChessContext";
import ChessPiece from "./ChessPiece";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

type SquareProps = {
  square: string;
  piece: string | null;
  isDark: boolean;
  isHighlighted: boolean;
  isLegalMove: boolean;
  isTutorialHighlight: boolean;
  onDrop: (from: string, to: string) => void;
  onSquareClick: (square: string) => void;
};

// Chess square component
const Square = ({ 
  square, 
  piece, 
  isDark, 
  isHighlighted, 
  isLegalMove, 
  isTutorialHighlight,
  onDrop, 
  onSquareClick 
}: SquareProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'piece',
    drop: (item: { from: string }) => onDrop(item.from, square),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        relative aspect-square flex items-center justify-center
        ${isDark ? "bg-[#B58863]" : "bg-[#F0D9B5]"}
        ${isHighlighted ? "border-2 border-blue-500" : ""}
        ${isOver ? "border-2 border-green-500" : ""}
        ${isTutorialHighlight ? "tutorial-highlight" : ""}
      `}
      onClick={() => onSquareClick(square)}
      data-square={square}
    >
      {piece && (
        <ChessPiece piece={piece} square={square} />
      )}
      {isLegalMove && (
        <div className="legal-move"></div>
      )}
    </div>
  );
};

// Player info component
type PlayerInfoProps = {
  name: string;
  rating?: number;
  time?: string;
  isActive: boolean;
  isWhite: boolean;
};

const PlayerInfo = ({ name, rating, time, isActive, isWhite }: PlayerInfoProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-2">
          <div className="font-medium">{name}</div>
          {rating && <div className="text-sm text-gray-500">{rating}</div>}
        </div>
      </div>
      {time && (
        <div className={`px-3 py-1 ${isActive ? isWhite ? "bg-accent" : "bg-primary" : "bg-gray-300"} text-white rounded-md flex items-center`}>
          <Clock className="h-4 w-4 mr-1" />
          <span className="font-mono">{time}</span>
        </div>
      )}
    </div>
  );
};

// Main ChessBoard component
type ChessBoardProps = {
  playerName?: string;
  opponentName?: string;
  playerRating?: number;
  opponentRating?: number;
  tutorialHighlightSquare?: string;
  onCompleteTutorialStep?: () => void;
};

const ChessBoard = ({
  playerName = "You",
  opponentName = "Computer",
  playerRating = 1500,
  opponentRating = 1200,
  tutorialHighlightSquare,
  onCompleteTutorialStep
}: ChessBoardProps) => {
  const { 
    game, 
    gameState, 
    boardOrientation, 
    showLegalMoves, 
    selectedPiece, 
    legalMoves, 
    makeMove, 
    selectPiece 
  } = useChessContext();

  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  // Format the board based on orientation
  const displayRanks = boardOrientation === "white" ? [...ranks].reverse() : ranks;
  const displayFiles = boardOrientation === "white" ? files : [...files].reverse();

  // Handle piece movement
  const handleDrop = (from: string, to: string) => {
    console.log('Attempting move:', from, 'to', to);
    
    const result = makeMove({ from, to });
    console.log('Move result:', result);
    
    if (result && tutorialHighlightSquare && from === tutorialHighlightSquare && onCompleteTutorialStep) {
      onCompleteTutorialStep();
    }
  };

  // Handle square click for piece selection
  const handleSquareClick = (square: string) => {
    console.log('Square clicked:', square);
    console.log('Selected piece:', selectedPiece);
    console.log('Legal moves:', legalMoves);
    
    // Handle tutorial highlighting
    if (
      tutorialHighlightSquare && 
      selectedPiece === tutorialHighlightSquare && 
      legalMoves.includes(square) && 
      onCompleteTutorialStep
    ) {
      console.log('Tutorial move attempt:', tutorialHighlightSquare, 'to', square);
      const result = makeMove({ from: tutorialHighlightSquare, to: square });
      console.log('Tutorial move result:', result);
      onCompleteTutorialStep();
      return;
    }
    
    selectPiece(square);
    console.log('After selection - Selected piece:', selectedPiece);
    console.log('After selection - Legal moves:', legalMoves);
  };

  // Generate squares for the board
  const squares = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rank = displayRanks[r];
      const file = displayFiles[f];
      const square = file + rank;
      const isDark = (r + f) % 2 === 1;
      
      const piece = game ? game.get(square) : null;
      const pieceCode = piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()) : null;
      
      const isHighlighted = selectedPiece === square;
      const isLegalMove = showLegalMoves && legalMoves.includes(square);
      const isTutorialHighlight = tutorialHighlightSquare === square;
      
      squares.push(
        <Square 
          key={square}
          square={square} 
          piece={pieceCode} 
          isDark={isDark} 
          isHighlighted={isHighlighted}
          isLegalMove={isLegalMove}
          isTutorialHighlight={isTutorialHighlight}
          onDrop={handleDrop}
          onSquareClick={handleSquareClick}
        />
      );
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="lg:w-2/3">
        <PlayerInfo 
          name={opponentName} 
          rating={opponentRating} 
          time="10:00"
          isActive={gameState?.turn === 'b'}
          isWhite={false}
        />

        <div className="chess-container mx-auto relative aspect-square border-4 border-primary rounded-md overflow-hidden shadow-lg">
          {/* Chess Board */}
          <div className="grid grid-cols-8 h-full">
            {squares}
          </div>

          {/* Coordinates - Files */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs md:text-sm">
            {displayFiles.map(file => (
              <div key={file}>{file}</div>
            ))}
          </div>

          {/* Coordinates - Ranks */}
          <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-around text-xs md:text-sm">
            {displayRanks.map(rank => (
              <div key={rank}>{rank}</div>
            ))}
          </div>
        </div>

        <PlayerInfo 
          name={playerName} 
          rating={playerRating} 
          time="10:00"
          isActive={gameState?.turn === 'w'}
          isWhite={true}
        />
      </div>
    </DndProvider>
  );
};

export default ChessBoard;
