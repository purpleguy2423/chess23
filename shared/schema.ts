import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rating: integer("rating").notNull().default(1200),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  whiteId: integer("white_id").references(() => users.id),
  blackId: integer("black_id").references(() => users.id),
  state: text("state").notNull(), // FEN notation of the current board state
  moves: text("moves").notNull(), // PGN format of the moves played
  status: text("status").notNull().default("active"), // active, checkmate, stalemate, draw, resigned, etc.
  winner: text("winner"), // white, black, draw
  aiDifficulty: integer("ai_difficulty"), // null if multiplayer, 1-5 if playing against AI
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).pick({
  whiteId: true,
  blackId: true,
  state: true,
  moves: true,
  status: true,
  aiDifficulty: true,
});

// Tutorial progress model
export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  lessonId: text("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTutorialProgressSchema = createInsertSchema(tutorialProgress).pick({
  userId: true,
  lessonId: true,
  completed: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = z.infer<typeof insertTutorialProgressSchema>;

// Game state types (for WebSocket communication)
export type GameMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type ChessGameState = {
  id: number;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  gameOver: boolean;
  status: string;
  winner?: 'white' | 'black' | 'draw';
  lastMove?: GameMove;
  whiteTime?: number;
  blackTime?: number;
  capturedPieces?: {
    white: string[];
    black: string[];
  };
};

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  boardState: string; // FEN notation
  highlightSquares: string[];
  legalMoves?: {[key: string]: string[]};
  expectedMove?: GameMove;
  nextStep?: string;
};

export type TutorialLesson = {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
};
