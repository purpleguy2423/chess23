import { 
  User, InsertUser, Game, InsertGame, 
  TutorialProgress, InsertTutorialProgress,
  TutorialLesson, TutorialStep, ChessGameState,
  users, games, tutorialProgress
} from "@shared/schema";

import { db } from "./db";
import { eq, or, and } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRating(userId: number, newRating: number): Promise<User | undefined>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGamesByUser(userId: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameState(gameId: number, state: string, moves: string, status: string, winner?: string): Promise<Game | undefined>;
  
  // Tutorial operations
  getTutorialProgress(userId: number): Promise<TutorialProgress[]>;
  updateTutorialProgress(userId: number, lessonId: string, completed: boolean): Promise<TutorialProgress | undefined>;
  
  // Tutorial content
  getTutorialLessons(): Promise<TutorialLesson[]>;
  getTutorialLesson(lessonId: string): Promise<TutorialLesson | undefined>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private tutorialLessons: Map<string, TutorialLesson>;

  constructor() {
    this.tutorialLessons = new Map();
    // Initialize with tutorial lessons
    this.initTutorialLessons();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserRating(userId: number, newRating: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ rating: newRating })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGamesByUser(userId: number): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.whiteId, userId), eq(games.blackId, userId)));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async updateGameState(
    gameId: number, 
    state: string, 
    moves: string, 
    status: string, 
    winner?: string
  ): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set({ 
        state, 
        moves, 
        status, 
        winner: winner || null,
        updatedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning();
    return updatedGame || undefined;
  }

  // Tutorial operations
  async getTutorialProgress(userId: number): Promise<TutorialProgress[]> {
    return await db
      .select()
      .from(tutorialProgress)
      .where(eq(tutorialProgress.userId, userId));
  }

  async updateTutorialProgress(
    userId: number, 
    lessonId: string, 
    completed: boolean
  ): Promise<TutorialProgress | undefined> {
    const [existingProgress] = await db
      .select()
      .from(tutorialProgress)
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.lessonId, lessonId)
      ));
    
    if (existingProgress) {
      const [updatedProgress] = await db
        .update(tutorialProgress)
        .set({ 
          completed,
          updatedAt: new Date()
        })
        .where(eq(tutorialProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db
        .insert(tutorialProgress)
        .values({
          userId,
          lessonId,
          completed
        })
        .returning();
      return newProgress;
    }
  }
  
  // Tutorial content - these are stored in memory as they are static content
  async getTutorialLessons(): Promise<TutorialLesson[]> {
    return Array.from(this.tutorialLessons.values());
  }
  
  async getTutorialLesson(lessonId: string): Promise<TutorialLesson | undefined> {
    return this.tutorialLessons.get(lessonId);
  }
  
  // Initialize tutorial lessons
  private initTutorialLessons() {
    const basicMovesLesson: TutorialLesson = {
      id: "basic-moves",
      title: "Basic Piece Movements",
      description: "Learn how each chess piece moves on the board",
      steps: [
        {
          id: "pawn-move",
          title: "Your First Move",
          description: "Let's start with a classic opening move. Try moving the e2 pawn forward.",
          boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
          highlightSquares: ["e2"],
          legalMoves: {"e2": ["e3", "e4"]},
          expectedMove: {from: "e2", to: "e4"},
          nextStep: "knight-move"
        },
        {
          id: "knight-move",
          title: "Knight Movement",
          description: "Knights move in an L-shape: 2 squares in one direction and then 1 square perpendicular to that direction.",
          boardState: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
          highlightSquares: ["g8"],
          legalMoves: {"g8": ["f6", "h6"]},
          expectedMove: {from: "g8", to: "f6"},
          nextStep: "bishop-move"
        },
        {
          id: "bishop-move",
          title: "Bishop Movement",
          description: "Bishops move diagonally any number of squares.",
          boardState: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
          highlightSquares: ["f1"],
          legalMoves: {"f1": ["e2", "d3", "c4", "b5", "a6"]},
          expectedMove: {from: "f1", to: "c4"},
          nextStep: "queen-move"
        },
        {
          id: "queen-move",
          title: "Queen Movement",
          description: "The queen is the most powerful piece, combining the movement of the rook and bishop.",
          boardState: "rnbqkb1r/pppppppp/5n2/8/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 2 2",
          highlightSquares: ["d8"],
          legalMoves: {"d8": ["d7", "d6", "d5", "d4", "d3", "e7", "f6", "g5", "h4"]},
          expectedMove: {from: "d8", to: "h4"},
          nextStep: "check-move"
        },
        {
          id: "check-move",
          title: "Check",
          description: "When a king is under attack, it is in 'check'. You must move out of check.",
          boardState: "rnb1kb1r/pppppppp/5n2/8/2B1P2q/8/PPPP1PPP/RNBQK1NR w KQkq - 3 3",
          highlightSquares: ["e1"],
          legalMoves: {"e1": ["e2", "f1"]},
          expectedMove: {from: "e1", to: "e2"},
          nextStep: null
        }
      ]
    };
    
    const captureLesson: TutorialLesson = {
      id: "captures",
      title: "Capturing Pieces",
      description: "Learn how to capture opponent's pieces",
      steps: [
        {
          id: "pawn-capture",
          title: "Pawn Captures",
          description: "Pawns capture diagonally, one square forward.",
          boardState: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
          highlightSquares: ["e4", "d5"],
          legalMoves: {"e4": ["e5", "d5"]},
          expectedMove: {from: "e4", to: "d5"},
          nextStep: "knight-capture"
        },
        {
          id: "knight-capture",
          title: "Knight Captures",
          description: "Knights capture by landing on a square occupied by an opponent's piece.",
          boardState: "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2",
          highlightSquares: ["g8", "d5"],
          legalMoves: {"g8": ["f6", "h6", "e7"]},
          expectedMove: {from: "g8", to: "f6"},
          nextStep: "bishop-capture"
        },
        {
          id: "bishop-capture",
          title: "Bishop Captures",
          description: "Bishops capture by landing on a square occupied by an opponent's piece.",
          boardState: "rnbqkb1r/ppp1pppp/5n2/3P4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3",
          highlightSquares: ["f1", "f6"],
          legalMoves: {"f1": ["e2", "d3", "c4", "b5", "a6", "g2", "h3"]},
          expectedMove: {from: "f1", to: "c4"},
          nextStep: "queen-capture"
        },
        {
          id: "queen-capture",
          title: "Queen Captures",
          description: "The queen captures like a combination of rook and bishop.",
          boardState: "rnbqkb1r/ppp1pppp/5n2/3P4/2B5/8/PPPP1PPP/RNBQK1NR b KQkq - 2 3",
          highlightSquares: ["d8", "d5"],
          legalMoves: {"d8": ["d7", "d6", "d5"]},
          expectedMove: {from: "d8", to: "d5"},
          nextStep: null
        }
      ]
    };
    
    this.tutorialLessons.set("basic-moves", basicMovesLesson);
    this.tutorialLessons.set("captures", captureLesson);
  }
}

export const storage = new DatabaseStorage();
