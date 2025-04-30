import { WebSocket } from "ws";
import { ChessGameState, GameMove } from "@shared/schema";
import { storage } from "../storage";

// Map of game IDs to connected players
export type PlayerConnection = {
  white?: WebSocket;
  black?: WebSocket;
  spectators: WebSocket[];
  gameState: ChessGameState;
  timers?: {
    white: number;
    black: number;
    lastMoveTime: number;
  }
};

export const activeGames = new Map<number, PlayerConnection>();

// Send game state to a specific player
export function sendGameState(ws: WebSocket, gameState: ChessGameState, color?: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'game_state',
      gameState,
      yourColor: color
    }));
  }
}

// Broadcast game state to all players in a game
export function broadcastGameState(gameId: number) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  const stateMessage = JSON.stringify({
    type: 'game_state',
    gameState: game.gameState
  });
  
  if (game.white && game.white.readyState === WebSocket.OPEN) {
    game.white.send(stateMessage);
  }
  
  if (game.black && game.black.readyState === WebSocket.OPEN) {
    game.black.send(stateMessage);
  }
  
  game.spectators.forEach(spectator => {
    if (spectator.readyState === WebSocket.OPEN) {
      spectator.send(stateMessage);
    }
  });
}

// Handle a player joining a game
export async function handleJoinGame(ws: WebSocket, gameId: number, color: string) {
  // Fetch the game from storage
  const game = await storage.getGame(gameId);
  if (!game) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Game not found'
    }));
    return null;
  }
  
  // Register connection with the game
  if (!activeGames.has(gameId)) {
    // Initialize game connection
    activeGames.set(gameId, {
      spectators: [],
      gameState: {
        id: game.id,
        fen: game.state,
        pgn: game.moves,
        turn: game.state.split(' ')[1] as 'w' | 'b',
        isCheck: false,
        isCheckmate: game.status === 'checkmate',
        isDraw: game.status === 'draw',
        isStalemate: game.status === 'stalemate',
        gameOver: ['checkmate', 'draw', 'stalemate', 'resigned'].includes(game.status),
        status: game.status,
        winner: game.winner as 'white' | 'black' | 'draw' | undefined,
        capturedPieces: { white: [], black: [] }
      }
    });
  }
  
  const gameConnection = activeGames.get(gameId)!;
  
  // Add player to the appropriate slot
  if (color === 'white' && !gameConnection.white) {
    gameConnection.white = ws;
  } else if (color === 'black' && !gameConnection.black) {
    gameConnection.black = ws;
  } else {
    gameConnection.spectators.push(ws);
    color = 'spectator';
  }
  
  // Send current game state
  sendGameState(ws, gameConnection.gameState, color);
  
  return color;
}

// Handle a move being made
export async function handleMove(
  ws: WebSocket, 
  gameId: number, 
  color: string, 
  move: GameMove, 
  updatedState: Partial<ChessGameState>
) {
  if (!activeGames.has(gameId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'No active game'
    }));
    return false;
  }
  
  const gameConn = activeGames.get(gameId)!;
  const isPlayersTurn = 
    (color === 'white' && gameConn.gameState.turn === 'w') ||
    (color === 'black' && gameConn.gameState.turn === 'b');
  
  if (!isPlayersTurn) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not your turn'
    }));
    return false;
  }
  
  // Update game in database
  const updatedGame = await storage.updateGameState(
    gameId,
    updatedState.fen || gameConn.gameState.fen,
    updatedState.pgn || gameConn.gameState.pgn,
    updatedState.status || gameConn.gameState.status,
    updatedState.winner
  );
  
  if (!updatedGame) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to update game'
    }));
    return false;
  }
  
  // Update the game state in memory
  gameConn.gameState = {
    ...gameConn.gameState,
    ...updatedState,
    id: updatedGame.id,
    status: updatedGame.status,
    winner: updatedGame.winner as 'white' | 'black' | 'draw' | undefined,
    lastMove: move
  };
  
  // Update timers if applicable
  if (gameConn.timers) {
    const now = Date.now();
    const elapsed = now - gameConn.timers.lastMoveTime;
    
    if (color === 'white') {
      gameConn.timers.white -= elapsed;
    } else {
      gameConn.timers.black -= elapsed;
    }
    
    gameConn.timers.lastMoveTime = now;
    
    // Add time info to the game state
    gameConn.gameState.whiteTime = gameConn.timers.white;
    gameConn.gameState.blackTime = gameConn.timers.black;
  }
  
  // Broadcast updated state to all players
  broadcastGameState(gameId);
  
  return true;
}

// Handle a player resigning
export async function handleResign(ws: WebSocket, gameId: number, color: string) {
  if (!activeGames.has(gameId)) return false;
  
  const winner = color === 'white' ? 'black' : 'white';
  await storage.updateGameState(
    gameId, 
    activeGames.get(gameId)!.gameState.fen,
    activeGames.get(gameId)!.gameState.pgn,
    'resigned',
    winner
  );
  
  // Update game state and broadcast
  const resignedGameConn = activeGames.get(gameId)!;
  resignedGameConn.gameState.gameOver = true;
  resignedGameConn.gameState.status = 'resigned';
  resignedGameConn.gameState.winner = winner;
  
  broadcastGameState(gameId);
  
  return true;
}

// Handle a player leaving a game
export function handlePlayerLeave(ws: WebSocket, gameId: number) {
  if (gameId && activeGames.has(gameId)) {
    const game = activeGames.get(gameId)!;
    
    // Remove this connection from the game
    if (game.white === ws) {
      game.white = undefined;
    } else if (game.black === ws) {
      game.black = undefined;
    } else {
      game.spectators = game.spectators.filter(s => s !== ws);
    }
    
    // Clean up the game if no players are left
    if (!game.white && !game.black && game.spectators.length === 0) {
      activeGames.delete(gameId);
    }
  }
}
