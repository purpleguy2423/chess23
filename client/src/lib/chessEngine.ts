import { Chess, Move, Square } from 'chess.js';
import { ChessGameState, GameMove } from '@shared/schema';

// Calculate a simple evaluation of the chess position
export function evaluatePosition(chess: Chess): number {
  // Piece values (standard piece values used in chess)
  const pieceValues: Record<string, number> = {
    p: -1, // Pawn
    n: -3, // Knight
    b: -3, // Bishop
    r: -5, // Rook
    q: -9, // Queen
    k: -100, // King
    P: 1, // White pawn
    N: 3, // White knight
    B: 3, // White bishop
    R: 5, // White rook
    Q: 9, // White queen
    K: 100 // White king
  };

  // Check for checkmate or stalemate
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -1000 : 1000; // Checkmate is worst/best depending on who is mated
  }

  if (chess.isDraw() || chess.isStalemate()) {
    return 0; // Draw is neutral
  }

  // Calculate material advantage
  let score = 0;
  const board = chess.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = board[i][j];
      if (square) {
        score += pieceValues[square.color === 'w' ? square.type.toUpperCase() : square.type];
      }
    }
  }

  // Add positional bonus for controlling the center
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const square of centerSquares) {
    const piece = chess.get(square as Square);
    if (piece) {
      score += piece.color === 'w' ? 0.2 : -0.2;
    }
    
    // Add a small bonus for attacking center squares
    const attacks = getAttackers(chess, square as Square);
    for (const attacker of attacks) {
      score += attacker.color === 'w' ? 0.1 : -0.1;
    }
  }

  return score;
}

// Find all pieces attacking a square
function getAttackers(chess: Chess, square: Square) {
  const attackers = [];
  const board = chess.board();
  
  // Define the chess squares
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        try {
          // Calculate the square name (e.g., 'a1', 'h8')
          const fromSquare = files[j] + ranks[7-i] as Square;
          
          // Try to move the piece to the target square to see if it's a legal move
          const move = {
            from: fromSquare,
            to: square,
            promotion: 'q' // Default promotion to queen for pawn moves
          };
          
          // Create a copy of the chess instance to test moves
          const testChess = new Chess(chess.fen());
          
          const result = testChess.move(move);
          if (result) {
            attackers.push(piece);
          }
        } catch (e) {
          // Ignore illegal moves
        }
      }
    }
  }
  
  return attackers;
}

// Find a move for the AI based on difficulty level
export function findAIMove(chess: Chess, difficulty: number): GameMove | null {
  console.log("findAIMove called with difficulty:", difficulty);
  console.log("Current game state:", chess.fen());
  console.log("Current turn:", chess.turn());
  console.log("Game over?", chess.isGameOver());
  
  // If the game is over, return null
  if (chess.isGameOver()) {
    console.log("Game is over, no AI move needed");
    return null;
  }

  try {
    // Based on difficulty, use different strategies
    let move: GameMove | null;
    
    switch(difficulty) {
      case 1: // Easiest - Random legal moves
        console.log("Using random move strategy");
        move = getRandomMove(chess);
        break;
      
      case 2: // Easy - Simple evaluation
        console.log("Using simple evaluation strategy");
        move = getBestMoveOneDepth(chess);
        break;
        
      case 3: // Medium - Look ahead 2 moves
        console.log("Using minimax with depth 2");
        move = minimaxMove(chess, 2);
        break;
        
      case 4: // Hard - Look ahead 3 moves
        console.log("Using minimax with depth 3");
        move = minimaxMove(chess, 3);
        break;
        
      case 5: // Hardest - Look ahead 4 moves with alpha-beta pruning
        console.log("Using alpha-beta pruning with depth 4");
        move = minimaxMoveAlphaBeta(chess, 4, -Infinity, Infinity, chess.turn() === 'w');
        break;
        
      default:
        console.log("Using default random move strategy");
        move = getRandomMove(chess);
    }
    
    console.log("AI calculated move:", move);
    return move;
  } catch (err) {
    console.error("Error in findAIMove:", err);
    // Fallback to random move in case of error
    return getRandomMove(chess);
  }
}

// Get a random legal move
function getRandomMove(chess: Chess): GameMove | null {
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * moves.length);
  const move = moves[randomIndex];
  
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion
  };
}

// Get the best move based on one-depth evaluation
function getBestMoveOneDepth(chess: Chess): GameMove | null {
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0) return null;
  
  let bestMove: Move | null = null;
  let bestScore = chess.turn() === 'w' ? -Infinity : Infinity;
  
  for (const move of moves) {
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    const score = evaluatePosition(testChess);
    
    if ((chess.turn() === 'w' && score > bestScore) || 
        (chess.turn() === 'b' && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  if (!bestMove) return getRandomMove(chess);
  
  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion
  };
}

// Minimax algorithm for looking ahead multiple moves
function minimaxMove(chess: Chess, depth: number): GameMove | null {
  const isMaximizing = chess.turn() === 'w';
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0 || depth === 0) return null;
  
  let bestMove: Move | null = null;
  let bestScore = isMaximizing ? -Infinity : Infinity;
  
  for (const move of moves) {
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    const score = minimax(testChess, depth - 1, !isMaximizing);
    
    if ((isMaximizing && score > bestScore) || 
        (!isMaximizing && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  if (!bestMove) return getRandomMove(chess);
  
  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion
  };
}

// Recursive minimax function
function minimax(chess: Chess, depth: number, isMaximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }
  
  const moves = chess.moves({ verbose: true });
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimax(testChess, depth - 1, false);
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimax(testChess, depth - 1, true);
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}

// Minimax with alpha-beta pruning for more efficient search
function minimaxMoveAlphaBeta(
  chess: Chess, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean
): GameMove | null {
  const moves = chess.moves({ verbose: true });
  
  if (moves.length === 0 || depth === 0) return null;
  
  let bestMove: Move | null = null;
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimaxAlphaBeta(testChess, depth - 1, alpha, beta, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimaxAlphaBeta(testChess, depth - 1, alpha, beta, true);
      
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
  }
  
  if (!bestMove) return getRandomMove(chess);
  
  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion
  };
}

// Recursive minimax function with alpha-beta pruning
function minimaxAlphaBeta(
  chess: Chess, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }
  
  const moves = chess.moves({ verbose: true });
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimaxAlphaBeta(testChess, depth - 1, alpha, beta, false);
      bestScore = Math.max(bestScore, score);
      
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      const score = minimaxAlphaBeta(testChess, depth - 1, alpha, beta, true);
      bestScore = Math.min(bestScore, score);
      
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return bestScore;
  }
}

// Convert chess.js state to our app's ChessGameState
export function convertToGameState(chess: Chess, gameId: number = 0): ChessGameState {
  return {
    id: gameId,
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isStalemate: chess.isStalemate(),
    gameOver: chess.isGameOver(),
    status: getGameStatus(chess),
    winner: getWinner(chess),
    capturedPieces: { white: [], black: [] }
  };
}

// Get current game status
function getGameStatus(chess: Chess): string {
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isDraw()) return 'draw';
  return 'active';
}

// Get winner if the game is over
function getWinner(chess: Chess): 'white' | 'black' | 'draw' | undefined {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? 'black' : 'white';
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 'draw';
  }
  return undefined;
}
