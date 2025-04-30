import { ChessGameState, GameMove } from "@shared/schema";

/**
 * A simple chess AI that makes moves based on a given difficulty level.
 * This uses a basic evaluation function and minimax algorithm with alpha-beta pruning.
 */

// Piece values for basic evaluation
const PIECE_VALUES: Record<string, number> = {
  'p': 1,  // pawn
  'n': 3,  // knight
  'b': 3,  // bishop
  'r': 5,  // rook
  'q': 9,  // queen
  'k': 100 // king
};

// Position evaluation bonus for central control (simplified)
const POSITION_BONUS = [
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
  [0.0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.0],
  [0.0, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.0],
  [0.0, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.0],
  [0.0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.0],
  [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
];

// Simplified function to parse FEN and create a board representation
function parseFen(fen: string): string[][] {
  const board: string[][] = [];
  const ranks = fen.split(' ')[0].split('/');
  
  for (const rank of ranks) {
    const row: string[] = [];
    for (const char of rank) {
      const num = parseInt(char);
      if (!isNaN(num)) {
        // Empty squares
        for (let i = 0; i < num; i++) {
          row.push('');
        }
      } else {
        // Piece
        row.push(char);
      }
    }
    board.push(row);
  }
  
  return board;
}

// Get piece color
function getPieceColor(piece: string): 'w' | 'b' | null {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

// Basic board evaluation function
function evaluateBoard(board: string[][]): number {
  let score = 0;
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;
      
      const pieceType = piece.toLowerCase();
      const color = getPieceColor(piece);
      const value = PIECE_VALUES[pieceType] || 0;
      
      // Add position bonus
      const positionValue = value + (value * POSITION_BONUS[i][j]);
      
      // Add or subtract based on color
      score += color === 'w' ? positionValue : -positionValue;
    }
  }
  
  return score;
}

// This function would normally use chess.js to generate legal moves
// For simplicity, we're mocking it with predefined moves
function generateLegalMoves(fen: string, side: 'w' | 'b'): GameMove[] {
  // In a real implementation, this would use chess.js to generate all legal moves
  // For this example, we'll return a simplified set
  
  // Get different moves for different positions and sides
  const fenParts = fen.split(' ');
  const board = parseFen(fen);
  const moves: GameMove[] = [];
  
  // Basic scanning for pieces of the correct color and generating simple moves
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;
      
      const pieceColor = getPieceColor(piece);
      if (pieceColor !== side) continue;
      
      const pieceType = piece.toLowerCase();
      const from = String.fromCharCode(97 + j) + (8 - i); // Convert to algebraic notation (a1, b2, etc.)
      
      // Generate simple moves based on piece type
      switch (pieceType) {
        case 'p': // Pawn
          // Move one square forward
          const direction = pieceColor === 'w' ? -1 : 1;
          const oneForward = i + direction;
          if (oneForward >= 0 && oneForward < 8 && !board[oneForward][j]) {
            moves.push({ from, to: String.fromCharCode(97 + j) + (8 - oneForward) });
            
            // Move two squares if in starting position
            const startingRank = pieceColor === 'w' ? 6 : 1;
            if (i === startingRank) {
              const twoForward = i + 2 * direction;
              if (twoForward >= 0 && twoForward < 8 && !board[twoForward][j] && !board[oneForward][j]) {
                moves.push({ from, to: String.fromCharCode(97 + j) + (8 - twoForward) });
              }
            }
          }
          
          // Capture diagonally
          for (const offset of [-1, 1]) {
            const captureCol = j + offset;
            if (captureCol >= 0 && captureCol < 8) {
              const captureRow = i + direction;
              if (captureRow >= 0 && captureRow < 8) {
                const targetPiece = board[captureRow][captureCol];
                if (targetPiece && getPieceColor(targetPiece) !== pieceColor) {
                  moves.push({ from, to: String.fromCharCode(97 + captureCol) + (8 - captureRow) });
                }
              }
            }
          }
          break;
          
        case 'n': // Knight
          for (const [dx, dy] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
            const r = i + dx;
            const c = j + dy;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
              const targetPiece = board[r][c];
              if (!targetPiece || getPieceColor(targetPiece) !== pieceColor) {
                moves.push({ from, to: String.fromCharCode(97 + c) + (8 - r) });
              }
            }
          }
          break;
          
        // Additional piece movement would be implemented similarly
        // This is simplified for demonstration
        default:
          // Generate a few random moves for other pieces
          const randomDir = Math.floor(Math.random() * 8);
          const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
          const [dx, dy] = dirs[randomDir];
          let r = i + dx;
          let c = j + dy;
          
          // Move in the selected direction as far as possible
          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const targetPiece = board[r][c];
            if (!targetPiece) {
              moves.push({ from, to: String.fromCharCode(97 + c) + (8 - r) });
            } else if (getPieceColor(targetPiece) !== pieceColor) {
              moves.push({ from, to: String.fromCharCode(97 + c) + (8 - r) });
              break;
            } else {
              break;
            }
            
            r += dx;
            c += dy;
            
            // Limit the number of moves to avoid infinite loops
            if (pieceType !== 'q' && pieceType !== 'r' && pieceType !== 'b') break;
          }
          break;
      }
    }
  }
  
  return moves;
}

// Minimax algorithm with alpha-beta pruning
function minimax(
  fen: string, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean
): { score: number, move?: GameMove } {
  if (depth === 0) {
    return { score: evaluateBoard(parseFen(fen)) };
  }
  
  const side = fen.split(' ')[1] as 'w' | 'b';
  const moves = generateLegalMoves(fen, side);
  
  if (moves.length === 0) {
    // No valid moves, could be checkmate or stalemate
    return { score: isMaximizing ? -1000 : 1000 };
  }
  
  let bestMove: GameMove | undefined;
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      // In a real implementation, we would apply the move to get the new FEN
      // Here we're using a simplified approach
      const newFen = applyMoveToFen(fen, move); // This is a placeholder function
      const { score } = minimax(newFen, depth - 1, alpha, beta, false);
      
      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newFen = applyMoveToFen(fen, move);
      const { score } = minimax(newFen, depth - 1, alpha, beta, true);
      
      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }
      
      beta = Math.min(beta, minScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    
    return { score: minScore, move: bestMove };
  }
}

// Placeholder for applying a move to a FEN string
// In a real implementation, this would use chess.js
function applyMoveToFen(fen: string, move: GameMove): string {
  // This is a simplified placeholder
  // We'd normally use chess.js to apply the move and get the new FEN
  
  // For the AI simulation, we'll just modify the FEN slightly to indicate the move
  const fenParts = fen.split(' ');
  const board = fenParts[0];
  const turn = fenParts[1] === 'w' ? 'b' : 'w'; // Switch turns
  const castling = fenParts[2];
  const enPassant = '-'; // Simplified, would need to calculate this properly
  const halfMove = parseInt(fenParts[4]) + 1;
  const fullMove = fenParts[1] === 'b' ? parseInt(fenParts[5]) + 1 : parseInt(fenParts[5]);
  
  return `${board} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

// Generate a random move for very simple AI
function getRandomMove(fen: string): GameMove | null {
  const side = fen.split(' ')[1] as 'w' | 'b';
  const moves = generateLegalMoves(fen, side);
  
  if (moves.length === 0) return null;
  
  return moves[Math.floor(Math.random() * moves.length)];
}

// Main function to simulate an AI move based on difficulty
export async function simulateAIMove(
  fen: string, 
  difficulty: number
): Promise<{
  fen: string,
  pgn: string,
  status: string,
  winner?: string,
  isCheck: boolean,
  isCheckmate: boolean,
  isDraw: boolean,
  isStalemate: boolean,
  gameOver: boolean,
  move: GameMove,
  capturedPieces: { white: string[], black: string[] }
} | null> {
  // For simplicity, we're using a mock implementation
  // In a real app, this would use chess.js to calculate the actual move
  
  let move: GameMove | null = null;
  
  // Different strategies based on difficulty
  switch (difficulty) {
    case 1: // Easiest - random moves
      move = getRandomMove(fen);
      break;
      
    case 2: // Easy - shallow search
      const easyResult = minimax(fen, 1, -Infinity, Infinity, fen.split(' ')[1] === 'w');
      move = easyResult.move;
      break;
      
    case 3: // Medium - deeper search
      const mediumResult = minimax(fen, 2, -Infinity, Infinity, fen.split(' ')[1] === 'w');
      move = mediumResult.move;
      break;
      
    case 4: // Hard - even deeper search
      const hardResult = minimax(fen, 3, -Infinity, Infinity, fen.split(' ')[1] === 'w');
      move = hardResult.move;
      break;
      
    case 5: // Hardest - deepest search
      const hardestResult = minimax(fen, 4, -Infinity, Infinity, fen.split(' ')[1] === 'w');
      move = hardestResult.move;
      break;
      
    default:
      move = getRandomMove(fen);
  }
  
  if (!move) return null;
  
  // Apply the move to get the new state
  // In a real implementation, we would use chess.js for this
  const newFen = applyMoveToFen(fen, move);
  
  // Generate a simple PGN from the move
  // This is a simplified placeholder
  const side = fen.split(' ')[1] === 'w' ? 'White' : 'Black';
  const moveNumber = parseInt(fen.split(' ')[5]);
  const pgn = `${moveNumber}. ${side} ${move.from}-${move.to}`;
  
  // In a real implementation, we would check for game end conditions
  // For this simplified example, we'll assume the game continues
  return {
    fen: newFen,
    pgn,
    status: 'active',
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
    isStalemate: false,
    gameOver: false,
    move,
    capturedPieces: { white: [], black: [] }
  };
}
