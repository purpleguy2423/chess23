import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chess, Move } from 'chess.js';
import { ChessGameState, GameMove } from '@shared/schema';

type ChessContextType = {
  game: Chess;
  gameState: ChessGameState | null;
  boardOrientation: 'white' | 'black';
  aiDifficulty: number;
  showLegalMoves: boolean;
  suggestMove: boolean;
  selectedPiece: string | null;
  legalMoves: string[];
  capturedPieces: {
    white: string[];
    black: string[];
  };
  
  // Actions
  makeMove: (move: GameMove) => boolean;
  resetGame: () => void;
  flipBoard: () => void;
  setAiDifficulty: (level: number) => void;
  setShowLegalMoves: (show: boolean) => void;
  setSuggestMove: (suggest: boolean) => void;
  selectPiece: (square: string) => void;
  newGame: (options?: { aiGame?: boolean, aiDifficulty?: number }) => void;
  takeBackMove: () => void;
  resign: () => void;
};

const ChessContext = createContext<ChessContextType | undefined>(undefined);

export const ChessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize chess.js instance
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [showLegalMoves, setShowLegalMoves] = useState(true);
  const [suggestMove, setSuggestMove] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: string[];
    black: string[];
  }>({ white: [], black: [] });

  // Update game state whenever the chess.js instance changes
  useEffect(() => {
    updateGameState();
  }, [game]);

  // Update the game state based on current chess.js state
  const updateGameState = () => {
    const newGameState: ChessGameState = {
      id: gameState?.id || 0,
      fen: game.fen(),
      pgn: game.pgn(),
      turn: game.turn() as 'w' | 'b',
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isDraw: game.isDraw(),
      isStalemate: game.isStalemate(),
      gameOver: game.isGameOver(),
      status: getGameStatus(),
      winner: getWinner(),
      capturedPieces: capturedPieces
    };
    setGameState(newGameState);
  };

  // Get the current game status
  const getGameStatus = (): string => {
    if (game.isCheckmate()) return 'checkmate';
    if (game.isStalemate()) return 'stalemate';
    if (game.isDraw()) return 'draw';
    return 'active';
  };

  // Get the winner if the game is over
  const getWinner = (): 'white' | 'black' | 'draw' | undefined => {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? 'black' : 'white';
    }
    if (game.isDraw() || game.isStalemate()) {
      return 'draw';
    }
    return undefined;
  };

  // Track captured pieces
  const updateCapturedPieces = (move: Move) => {
    if (move.captured) {
      const capturedColor = move.color === 'w' ? 'black' : 'white';
      const piece = move.captured.toUpperCase();
      
      setCapturedPieces(prev => {
        const newCapturedPieces = { ...prev };
        if (capturedColor === 'white') {
          newCapturedPieces.white = [...prev.white, piece];
        } else {
          newCapturedPieces.black = [...prev.black, piece];
        }
        return newCapturedPieces;
      });
    }
  };

  // Make a move on the board
  const makeMove = (moveObj: GameMove): boolean => {
    try {
      const move = game.move(moveObj);
      if (move) {
        updateCapturedPieces(move);
        updateGameState();
        setSelectedPiece(null);
        setLegalMoves([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  };

  // Reset the game to initial state
  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCapturedPieces({ white: [], black: [] });
    setSelectedPiece(null);
    setLegalMoves([]);
  };

  // Flip the board orientation
  const flipBoard = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Select a piece and show legal moves
  const selectPiece = (square: string) => {
    if (!square) {
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedPiece(square);
      
      // Get legal moves for this piece
      const moves = game.moves({ square, verbose: true });
      const destinations = moves.map(move => move.to);
      setLegalMoves(destinations);
    } else {
      // If we click on a square where we can move the selected piece
      if (selectedPiece && legalMoves.includes(square)) {
        makeMove({ from: selectedPiece, to: square });
      } else {
        setSelectedPiece(null);
        setLegalMoves([]);
      }
    }
  };

  // Start a new game
  const newGame = (options?: { aiGame?: boolean, aiDifficulty?: number }) => {
    resetGame();
    if (options?.aiGame && options.aiDifficulty) {
      setAiDifficulty(options.aiDifficulty);
    }
  };

  // Take back the last move
  const takeBackMove = () => {
    game.undo();
    // If playing against AI, take back the AI's move too
    if (game.history().length > 0) {
      game.undo();
    }
    updateGameState();
  };

  // Resign the game
  const resign = () => {
    const winner = game.turn() === 'w' ? 'black' : 'white';
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gameOver: true,
        status: 'resigned',
        winner
      };
    });
  };

  const value = {
    game,
    gameState,
    boardOrientation,
    aiDifficulty,
    showLegalMoves,
    suggestMove,
    selectedPiece,
    legalMoves,
    capturedPieces,
    
    makeMove,
    resetGame,
    flipBoard,
    setAiDifficulty,
    setShowLegalMoves,
    setSuggestMove,
    selectPiece,
    newGame,
    takeBackMove,
    resign
  };

  return (
    <ChessContext.Provider value={value}>
      {children}
    </ChessContext.Provider>
  );
};

export const useChessContext = () => {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error('useChessContext must be used within a ChessProvider');
  }
  return context;
};
