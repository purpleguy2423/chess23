import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { ChessGameState, GameMove, insertUserSchema, insertGameSchema } from "@shared/schema";
import { simulateAIMove } from "./ai/chessAI";

// Map of game IDs to connected players
type PlayerConnection = {
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

const activeGames = new Map<number, PlayerConnection>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let gameId: number | null = null;
    let playerColor: 'white' | 'black' | 'spectator' = 'spectator';
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_game':
            // Join an existing game
            gameId = data.gameId;
            playerColor = data.color || 'spectator';
            
            // Fetch the game from storage
            const game = await storage.getGame(gameId);
            if (!game) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Game not found'
              }));
              return;
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
              
              // Set up game timer if needed
              if (data.timeControl) {
                activeGames.get(gameId)!.timers = {
                  white: data.timeControl * 60 * 1000, // Convert minutes to milliseconds
                  black: data.timeControl * 60 * 1000,
                  lastMoveTime: Date.now()
                };
              }
            }
            
            const gameConnection = activeGames.get(gameId)!;
            
            // Add player to the appropriate slot
            if (playerColor === 'white' && !gameConnection.white) {
              gameConnection.white = ws;
            } else if (playerColor === 'black' && !gameConnection.black) {
              gameConnection.black = ws;
            } else {
              gameConnection.spectators.push(ws);
              playerColor = 'spectator';
            }
            
            // Send current game state
            ws.send(JSON.stringify({
              type: 'game_state',
              gameState: gameConnection.gameState,
              yourColor: playerColor
            }));
            
            break;
            
          case 'make_move':
            if (!gameId || !activeGames.has(gameId)) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'No active game'
              }));
              return;
            }
            
            const gameConn = activeGames.get(gameId)!;
            const isPlayersTurn = 
              (playerColor === 'white' && gameConn.gameState.turn === 'w') ||
              (playerColor === 'black' && gameConn.gameState.turn === 'b');
            
            if (!isPlayersTurn) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not your turn'
              }));
              return;
            }
            
            // Process the move
            const move: GameMove = data.move;
            
            // Update game state on server side
            try {
              // Update game in database
              const updatedGame = await storage.updateGameState(
                gameId,
                data.fen,
                data.pgn,
                data.status,
                data.winner
              );
              
              if (!updatedGame) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to update game'
                }));
                return;
              }
              
              // Update the game state in memory
              gameConn.gameState = {
                id: updatedGame.id,
                fen: data.fen,
                pgn: data.pgn,
                turn: data.fen.split(' ')[1] as 'w' | 'b',
                isCheck: data.isCheck || false,
                isCheckmate: data.isCheckmate || false,
                isDraw: data.isDraw || false,
                isStalemate: data.isStalemate || false,
                gameOver: data.gameOver || false,
                status: updatedGame.status,
                winner: updatedGame.winner as 'white' | 'black' | 'draw' | undefined,
                lastMove: move,
                capturedPieces: data.capturedPieces || { white: [], black: [] }
              };
              
              // Update timers if applicable
              if (gameConn.timers) {
                const now = Date.now();
                const elapsed = now - gameConn.timers.lastMoveTime;
                
                if (playerColor === 'white') {
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
              const gameState = gameConn.gameState;
              const gameStateMsg = JSON.stringify({
                type: 'game_state',
                gameState
              });
              
              if (gameConn.white && gameConn.white.readyState === WebSocket.OPEN) {
                gameConn.white.send(gameStateMsg);
              }
              
              if (gameConn.black && gameConn.black.readyState === WebSocket.OPEN) {
                gameConn.black.send(gameStateMsg);
              }
              
              gameConn.spectators.forEach(spectator => {
                if (spectator.readyState === WebSocket.OPEN) {
                  spectator.send(gameStateMsg);
                }
              });
              
              // If playing against AI, generate AI move
              const game = await storage.getGame(gameId);
              if (game && game.aiDifficulty && 
                  ((playerColor === 'white' && gameConn.gameState.turn === 'b') ||
                   (playerColor === 'black' && gameConn.gameState.turn === 'w'))) {
                
                // Small delay to make it feel more natural
                setTimeout(async () => {
                  const aiMove = await simulateAIMove(
                    gameConn.gameState.fen, 
                    game.aiDifficulty || 1
                  );
                  
                  if (aiMove) {
                    // Update server-side game state with AI move
                    // (this would typically be done by the client)
                    const updatedAiGame = await storage.updateGameState(
                      gameId,
                      aiMove.fen,
                      aiMove.pgn,
                      aiMove.status,
                      aiMove.winner
                    );
                    
                    if (updatedAiGame) {
                      // Update in-memory game state
                      gameConn.gameState = {
                        ...gameConn.gameState,
                        fen: aiMove.fen,
                        pgn: aiMove.pgn,
                        turn: aiMove.fen.split(' ')[1] as 'w' | 'b',
                        isCheck: aiMove.isCheck,
                        isCheckmate: aiMove.isCheckmate,
                        isDraw: aiMove.isDraw,
                        isStalemate: aiMove.isStalemate,
                        gameOver: aiMove.gameOver,
                        status: updatedAiGame.status,
                        winner: updatedAiGame.winner as 'white' | 'black' | 'draw' | undefined,
                        lastMove: aiMove.move,
                        capturedPieces: aiMove.capturedPieces
                      };
                      
                      // Broadcast AI move
                      const aiGameStateMsg = JSON.stringify({
                        type: 'game_state',
                        gameState: gameConn.gameState
                      });
                      
                      if (gameConn.white && gameConn.white.readyState === WebSocket.OPEN) {
                        gameConn.white.send(aiGameStateMsg);
                      }
                      
                      if (gameConn.black && gameConn.black.readyState === WebSocket.OPEN) {
                        gameConn.black.send(aiGameStateMsg);
                      }
                      
                      gameConn.spectators.forEach(spectator => {
                        if (spectator.readyState === WebSocket.OPEN) {
                          spectator.send(aiGameStateMsg);
                        }
                      });
                    }
                  }
                }, 500);
              }
            } catch (error) {
              console.error('Error processing move:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process move'
              }));
            }
            
            break;
            
          case 'resign':
            if (!gameId || !activeGames.has(gameId)) break;
            
            const winner = playerColor === 'white' ? 'black' : 'white';
            await storage.updateGameState(gameId, 
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
            
            const resignStateMsg = JSON.stringify({
              type: 'game_state',
              gameState: resignedGameConn.gameState
            });
            
            if (resignedGameConn.white && resignedGameConn.white.readyState === WebSocket.OPEN) {
              resignedGameConn.white.send(resignStateMsg);
            }
            
            if (resignedGameConn.black && resignedGameConn.black.readyState === WebSocket.OPEN) {
              resignedGameConn.black.send(resignStateMsg);
            }
            
            resignedGameConn.spectators.forEach(spectator => {
              if (spectator.readyState === WebSocket.OPEN) {
                spectator.send(resignStateMsg);
              }
            });
            
            break;
            
          case 'tutorial_progress':
            // Update tutorial progress
            if (!data.userId || !data.lessonId) break;
            
            await storage.updateTutorialProgress(
              data.userId,
              data.lessonId,
              data.completed
            );
            
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
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
    });
  });
  
  // REST API routes
  
  // User routes
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        username: user.username,
        rating: user.rating
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  // Game routes
  app.post('/api/games', async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid game data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create game' });
    }
  });
  
  app.get('/api/games/:id', async (req, res) => {
    const gameId = parseInt(req.params.id);
    if (isNaN(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }
    
    const game = await storage.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  });
  
  app.get('/api/users/:userId/games', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const games = await storage.getGamesByUser(userId);
    res.json(games);
  });
  
  // Tutorial routes
  app.get('/api/tutorials', async (req, res) => {
    const lessons = await storage.getTutorialLessons();
    res.json(lessons);
  });
  
  app.get('/api/tutorials/:lessonId', async (req, res) => {
    const lesson = await storage.getTutorialLesson(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Tutorial lesson not found' });
    }
    res.json(lesson);
  });
  
  app.get('/api/users/:userId/tutorials', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const progress = await storage.getTutorialProgress(userId);
    res.json(progress);
  });
  
  app.post('/api/users/:userId/tutorials/:lessonId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { lessonId } = req.params;
    const { completed } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'Completed must be a boolean' });
    }
    
    const progress = await storage.updateTutorialProgress(userId, lessonId, completed);
    res.json(progress);
  });

  return httpServer;
}
