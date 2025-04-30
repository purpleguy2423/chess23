import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChessGameState, GameMove } from '@shared/schema';
import { Chess } from 'chess.js';
import { convertToGameState } from '@/lib/chessEngine';
import { apiRequest } from '@/lib/queryClient';

type MultiplayerStatus = 'disconnected' | 'connecting' | 'connected' | 'waiting' | 'playing';

export function useMultiplayer() {
  const [status, setStatus] = useState<MultiplayerStatus>('disconnected');
  const [gameId, setGameId] = useState<number | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | 'spectator'>('white');
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [opponentName, setOpponentName] = useState("Opponent");
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [canMove, setCanMove] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Initialize WebSocket connection
  const connectToGame = useCallback((gameId: number, color: 'white' | 'black' | 'spectator' = 'white') => {
    setStatus('connecting');
    
    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      setStatus('connected');
      setGameId(gameId);
      setPlayerColor(color);
      
      // Join the game room
      socket.send(JSON.stringify({
        type: 'join_game',
        gameId,
        color
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'game_state':
          handleGameStateUpdate(data.gameState, data.yourColor);
          break;
          
        case 'error':
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
          break;
          
        default:
          console.log('Unhandled message type:', data.type);
      }
    };
    
    socket.onclose = () => {
      setStatus('disconnected');
      
      toast({
        title: "Disconnected",
        description: "Connection to the game server was lost.",
        variant: "destructive",
      });
    };
    
    socket.onerror = () => {
      setStatus('disconnected');
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to the game server.",
        variant: "destructive",
      });
    };
  }, [toast]);

  // Handle game state updates from the server
  const handleGameStateUpdate = useCallback((newGameState: ChessGameState, color?: string) => {
    setGameState(newGameState);
    
    if (color) {
      setPlayerColor(color as 'white' | 'black' | 'spectator');
    }
    
    // Update local chess instance
    const newChess = new Chess();
    if (newGameState.fen) {
      try {
        newChess.load(newGameState.fen);
        setChess(newChess);
        
        // Update legal moves if a piece is selected
        if (selectedPiece) {
          const moves = newChess.moves({ square: selectedPiece, verbose: true });
          setLegalMoves(moves.map(move => move.to));
        }
        
        // Check if it's our turn
        const isOurTurn = 
          (playerColor === 'white' && newGameState.turn === 'w') || 
          (playerColor === 'black' && newGameState.turn === 'b');
        
        setCanMove(isOurTurn && !newGameState.gameOver);
        
        // Show game status notifications
        if (newGameState.isCheckmate) {
          const winner = newGameState.turn === 'w' ? 'Black' : 'White';
          toast({
            title: "Checkmate!",
            description: `${winner} wins by checkmate.`,
            variant: "default",
          });
        } else if (newGameState.isDraw) {
          toast({
            title: "Draw!",
            description: "The game ends in a draw.",
            variant: "default",
          });
        } else if (newGameState.isStalemate) {
          toast({
            title: "Stalemate!",
            description: "The game ends in a stalemate.",
            variant: "default",
          });
        } else if (newGameState.status === 'resigned') {
          toast({
            title: "Resignation",
            description: `${newGameState.winner === 'white' ? 'Black' : 'White'} resigned. ${newGameState.winner?.charAt(0).toUpperCase()}${newGameState.winner?.slice(1)} wins.`,
            variant: "default",
          });
        }
      } catch (e) {
        console.error('Error loading FEN:', e);
      }
    }
    
    // If we're now playing, update status
    if (status === 'waiting' || status === 'connected') {
      setStatus('playing');
    }
  }, [playerColor, selectedPiece, status, toast]);

  // Create a new game
  const createGame = useCallback(async (againstAI: boolean = false, aiDifficulty?: number) => {
    try {
      // Create a new game in the database
      const response = await apiRequest('POST', '/api/games', {
        whiteId: null, // Can be null for anonymous play
        blackId: null,
        state: new Chess().fen(),
        moves: '',
        status: 'active',
        aiDifficulty: againstAI ? aiDifficulty || 1 : null
      });
      
      const gameData = await response.json();
      setGameId(gameData.id);
      
      // Connect to the WebSocket for this game
      connectToGame(gameData.id, 'white');
      setStatus('waiting');
      
      toast({
        title: "Game Created",
        description: againstAI 
          ? "Starting a new game against the computer." 
          : "Waiting for an opponent to join.",
        variant: "default",
      });
      
      return gameData.id;
    } catch (error) {
      console.error('Error creating game:', error);
      
      toast({
        title: "Error",
        description: "Failed to create a new game.",
        variant: "destructive",
      });
      
      return null;
    }
  }, [connectToGame, toast]);

  // Join an existing game
  const joinGame = useCallback((id: number, color: 'white' | 'black' | 'spectator' = 'black') => {
    connectToGame(id, color);
    setStatus('waiting');
    
    toast({
      title: "Joining Game",
      description: `Connecting to game #${id} as ${color}.`,
      variant: "default",
    });
  }, [connectToGame, toast]);

  // Make a move
  const makeMove = useCallback((move: GameMove): boolean => {
    if (!gameId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Not Connected",
        description: "You are not connected to a game.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!canMove) {
      toast({
        title: "Not Your Turn",
        description: "It's not your turn to move.",
        variant: "destructive",
      });
      return false;
    }
    
    // Try to make the move locally first to validate it
    try {
      const newChess = new Chess(chess.fen());
      const result = newChess.move(move);
      
      if (!result) {
        toast({
          title: "Invalid Move",
          description: "That move is not allowed.",
          variant: "destructive",
        });
        return false;
      }
      
      // If the move is valid, send it to the server
      const newGameState = convertToGameState(newChess, gameId);
      
      socketRef.current.send(JSON.stringify({
        type: 'make_move',
        gameId,
        move,
        fen: newChess.fen(),
        pgn: newChess.pgn(),
        status: newGameState.status,
        winner: newGameState.winner,
        isCheck: newGameState.isCheck,
        isCheckmate: newGameState.isCheckmate,
        isDraw: newGameState.isDraw,
        isStalemate: newGameState.isStalemate,
        gameOver: newGameState.gameOver
      }));
      
      // Update local state
      setChess(newChess);
      setSelectedPiece(null);
      setLegalMoves([]);
      
      return true;
    } catch (error) {
      console.error('Error making move:', error);
      
      toast({
        title: "Error",
        description: "Failed to make the move.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [canMove, chess, gameId, toast]);

  // Resign from the game
  const resign = useCallback(() => {
    if (!gameId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Not Connected",
        description: "You are not connected to a game.",
        variant: "destructive",
      });
      return;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'resign',
      gameId
    }));
    
    toast({
      title: "Resigned",
      description: "You have resigned from the game.",
      variant: "default",
    });
  }, [gameId, toast]);

  // Select a piece
  const selectPiece = useCallback((square: string) => {
    if (!canMove) {
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    if (!square) {
      setSelectedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    const piece = chess.get(square);
    const isOurPiece = 
      (playerColor === 'white' && piece?.color === 'w') || 
      (playerColor === 'black' && piece?.color === 'b');
    
    if (piece && isOurPiece) {
      setSelectedPiece(square);
      
      // Get legal moves for this piece
      const moves = chess.moves({ square, verbose: true });
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
  }, [canMove, chess, legalMoves, makeMove, playerColor, selectedPiece]);

  // Cleanup WebSocket connection when component unmounts
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    status,
    gameId,
    playerColor,
    gameState,
    chess,
    opponentName,
    selectedPiece,
    legalMoves,
    canMove,
    
    connectToGame,
    createGame,
    joinGame,
    makeMove,
    resign,
    selectPiece
  };
}
