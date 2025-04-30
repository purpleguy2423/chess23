import { useState, useEffect, useCallback } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { GameMove, ChessGameState } from '@shared/schema';
import { findAIMove, convertToGameState } from '@/lib/chessEngine';
import { useToast } from '@/hooks/use-toast';

export function useChessGame(initialFen?: string) {
  const [chess, setChess] = useState<Chess>(new Chess(initialFen));
  const [gameState, setGameState] = useState<ChessGameState>(convertToGameState(new Chess(initialFen)));
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
  const [suggestedMove, setSuggestedMove] = useState<GameMove | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiGame, setIsAiGame] = useState(false);
  
  const { toast } = useToast();

  // Update game state whenever the chess.js instance changes
  useEffect(() => {
    const newGameState = convertToGameState(chess);
    setGameState(newGameState);
    
    // Update suggested move if enabled
    if (suggestMove && !newGameState.gameOver) {
      const suggested = findAIMove(chess, 2); // Always use level 2 for suggestions
      setSuggestedMove(suggested);
    } else {
      setSuggestedMove(null);
    }
    
    // Make AI move if it's an AI game and it's AI's turn
    if (isAiGame && !newGameState.gameOver) {
      const isAiTurn = (boardOrientation === 'white' && chess.turn() === 'b') || 
                      (boardOrientation === 'black' && chess.turn() === 'w');
      
      if (isAiTurn) {
        makeAiMove();
      }
    }
  }, [chess, suggestMove, isAiGame, boardOrientation]);

  // Track captured pieces
  const updateCapturedPieces = useCallback((move: Move) => {
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
  }, []);

  // Make a move on the board
  const makeMove = useCallback((moveObj: GameMove): boolean => {
    try {
      const move = chess.move(moveObj);
      if (move) {
        updateCapturedPieces(move);
        setChess(new Chess(chess.fen()));
        setSelectedPiece(null);
        setLegalMoves([]);
        
        // Check for game end conditions
        if (chess.isCheckmate()) {
          const winner = chess.turn() === 'w' ? 'Black' : 'White';
          toast({
            title: "Checkmate!",
            description: `${winner} wins by checkmate.`,
            variant: "default",
          });
        } else if (chess.isDraw()) {
          toast({
            title: "Draw!",
            description: "The game ends in a draw.",
            variant: "default",
          });
        } else if (chess.isStalemate()) {
          toast({
            title: "Stalemate!",
            description: "The game ends in a stalemate.",
            variant: "default",
          });
        } else if (chess.isCheck()) {
          toast({
            title: "Check!",
            description: `${chess.turn() === 'w' ? 'White' : 'Black'} is in check.`,
            variant: "default",
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      toast({
        title: "Invalid Move",
        description: "That move is not allowed.",
        variant: "destructive",
      });
      return false;
    }
  }, [chess, toast, updateCapturedPieces]);

  // Make an AI move
  const makeAiMove = useCallback(async () => {
    setIsAiThinking(true);
    
    // Small delay to make it feel more natural
    setTimeout(() => {
      const aiMove = findAIMove(chess, aiDifficulty);
      if (aiMove) {
        makeMove(aiMove);
      }
      setIsAiThinking(false);
    }, 500);
  }, [chess, aiDifficulty, makeMove]);

  // Reset the game to initial state
  const resetGame = useCallback(() => {
    const newChess = new Chess();
    setChess(newChess);
    setCapturedPieces({ white: [], black: [] });
    setSelectedPiece(null);
    setLegalMoves([]);
    setSuggestedMove(null);
  }, []);

  // Flip the board orientation
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Select a piece and show legal moves
  const selectPiece = useCallback((square: string) => {
    if (!square) {
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    const piece = chess.get(square as Square);
    if (piece && piece.color === chess.turn()) {
      setSelectedPiece(square);
      
      // Get legal moves for this piece
      const moves = chess.moves({ square: square as Square, verbose: true });
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
  }, [chess, legalMoves, makeMove, selectedPiece]);

  // Start a new game
  const newGame = useCallback((options?: { aiGame?: boolean, aiDifficulty?: number }) => {
    resetGame();
    if (options?.aiGame) {
      setIsAiGame(true);
      if (options.aiDifficulty) {
        setAiDifficulty(options.aiDifficulty);
      }
    } else {
      setIsAiGame(false);
    }
  }, [resetGame]);

  // Take back the last move
  const takeBackMove = useCallback(() => {
    if (chess.history().length === 0) {
      toast({
        title: "No moves to take back",
        description: "You haven't made any moves yet.",
        variant: "destructive",
      });
      return;
    }
    
    const newChess = new Chess(chess.fen());
    newChess.undo();
    
    // If playing against AI, take back the AI's move too
    if (isAiGame && newChess.history().length > 0) {
      newChess.undo();
    }
    
    setChess(newChess);
    setSelectedPiece(null);
    setLegalMoves([]);
    
    // Update captured pieces
    // This is a simplified approach - in a real app you'd track this more carefully
    const capturedWhite: string[] = [];
    const capturedBlack: string[] = [];
    
    newChess.history({ verbose: true }).forEach(move => {
      if (move.captured) {
        if (move.color === 'w') {
          capturedBlack.push(move.captured.toUpperCase());
        } else {
          capturedWhite.push(move.captured.toUpperCase());
        }
      }
    });
    
    setCapturedPieces({
      white: capturedWhite,
      black: capturedBlack
    });
    
    toast({
      title: "Move taken back",
      description: "The last move has been undone.",
      variant: "default",
    });
  }, [chess, isAiGame, toast]);

  // Resign the game
  const resign = useCallback(() => {
    const winner = chess.turn() === 'w' ? 'black' : 'white';
    
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      status: 'resigned',
      winner: winner as 'white' | 'black'
    }));
    
    toast({
      title: "Game Over",
      description: `${chess.turn() === 'w' ? 'White' : 'Black'} has resigned. ${chess.turn() === 'w' ? 'Black' : 'White'} wins.`,
      variant: "default",
    });
  }, [chess, toast]);

  return {
    chess,
    gameState,
    boardOrientation,
    aiDifficulty,
    showLegalMoves,
    suggestMove,
    selectedPiece,
    legalMoves,
    capturedPieces,
    suggestedMove,
    isAiThinking,
    isAiGame,
    
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
}
