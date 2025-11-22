
export enum Direction {
  NORTH = 'North',
  SOUTH = 'South',
  EAST = 'East',
  WEST = 'West',
  STOP = 'Stop'
}

export enum Algorithm {
  REFLEX = 'Reflex',
  MINIMAX = 'Minimax',
  ALPHABETA = 'AlphaBeta'
}

export interface Position {
  x: number;
  y: number;
}

export interface GhostState {
  id: number;
  position: Position;
  scaredTimer: number;
}

export interface GameState {
  grid: string[][];
  pacmanPos: Position;
  ghosts: GhostState[];
  score: number;
  foodCount: number;
  capsules: Position[];
  walls: boolean[][];
  width: number;
  height: number;
  gameOver: boolean;
  win: boolean;
}

export interface AIHeuristics {
  totalScore: number;
  foodScore: number;
  capsuleScore: number;
  ghostScore: number;
  wallPenalty: number;
  movementPenalty: number;
  foodCountPenalty: number;
}

export interface DebugInfo {
    nodesVisited: number;
    treeDepth: number;
    principalVariation: Position[]; // The predicted path of Pacman
    pruningCount?: number;
    executionTimeMs?: number;
}

export interface ScoredMove {
  direction: Direction;
  heuristics: AIHeuristics;
  debugInfo?: DebugInfo;
}
