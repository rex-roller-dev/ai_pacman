
import { CELL_TYPES } from '../constants';
import { Direction, GameState, AIHeuristics, ScoredMove, Algorithm, Position } from '../types';
import { generateAgentSuccessor, getLegalActions, manhattanDistance } from './gameLogic';

// Ported exactly from the User's 'betterEvaluationFunction'
export const calculateHeuristics = (state: GameState): AIHeuristics => {
  const { pacmanPos, ghosts, capsules, walls } = state;
  let score = state.score;

  let foodScore = 0;
  let capsuleScore = 0;
  let ghostScore = 0;
  let wallPenalty = 0;
  let movementPenalty = 0;
  let foodCountPenalty = 0;

  // --- FEATURE 1: Distance to closest food ---
  const foodList: {x: number, y: number}[] = [];
  for(let y=0; y<state.height; y++) {
      for(let x=0; x<state.width; x++) {
          if(state.grid[y][x] === CELL_TYPES.FOOD) foodList.push({x, y});
      }
  }

  if (foodList.length > 0) {
    const closestFoodDist = Math.min(...foodList.map(f => manhattanDistance(pacmanPos, f)));
    foodScore += 15 / (closestFoodDist + 1);
  }

  // --- FEATURE 2: Total remaining food penalty ---
  foodCountPenalty = -4 * foodList.length;
  score += foodCountPenalty;

  // --- FEATURE 3: Capsule priority ---
  if (capsules.length > 0) {
    const closestCap = Math.min(...capsules.map(c => manhattanDistance(pacmanPos, c)));
    capsuleScore += 40 / (closestCap + 1);
    capsuleScore -= 20 * capsules.length;
  }

  // --- FEATURE 4: Ghost awareness ---
  for (const ghost of ghosts) {
    const ghostDist = manhattanDistance(pacmanPos, ghost.position);
    
    if (ghost.scaredTimer > 0) {
        // Ghost edible: CHASE IT
        ghostScore += 100 / (ghostDist + 1);
    } else {
        // Ghost active: Avoid
        if (ghostDist === 0) {
            ghostScore -= 999999; // Death
        } else {
            ghostScore -= 40 / (ghostDist + 1);
        }
    }
  }

  // --- FEATURE 5: Avoid dead corners ---
  const x = pacmanPos.x;
  const y = pacmanPos.y;
  // Check neighbors for walls
  let nearbyWalls = 0;
  if (walls[y][x+1]) nearbyWalls++;
  if (walls[y][x-1]) nearbyWalls++;
  if (walls[y+1][x]) nearbyWalls++;
  if (walls[y-1][x]) nearbyWalls++;

  if (nearbyWalls >= 3) {
      wallPenalty -= 200;
  }

  // --- FEATURE 6: Encourage smooth motion (Penalty for Stop) ---
  movementPenalty -= 20; 

  const totalScore = score + foodScore + capsuleScore + ghostScore + wallPenalty + movementPenalty;

  return {
      totalScore,
      foodScore,
      capsuleScore,
      ghostScore,
      wallPenalty,
      movementPenalty,
      foodCountPenalty
  };
};

// --- SEARCH ALGORITHMS ---

interface SearchStats {
    nodesVisited: number;
}

interface SearchResult {
    value: number;
    path: Position[];
}

// Minimax Implementation
const minimax = (
    state: GameState, 
    agentIndex: number, 
    depth: number, 
    maxDepth: number, 
    stats: SearchStats
): SearchResult => {
    stats.nodesVisited++;
    if (state.gameOver || state.win || depth === maxDepth) {
        return { value: calculateHeuristics(state).totalScore, path: [state.pacmanPos] };
    }

    const numAgents = state.ghosts.length + 1;
    const nextAgent = (agentIndex + 1) % numAgents;
    const nextDepth = nextAgent === 0 ? depth + 1 : depth;

    const legalActions = getLegalActions(state, agentIndex);
    if (legalActions.length === 0) {
        return { value: calculateHeuristics(state).totalScore, path: [state.pacmanPos] };
    }

    if (agentIndex === 0) { // MAX (Pacman)
        let bestValue = -Infinity;
        let bestPath: Position[] = [];

        for (const action of legalActions) {
            const successor = generateAgentSuccessor(state, agentIndex, action);
            const result = minimax(successor, nextAgent, nextDepth, maxDepth, stats);
            
            if (result.value > bestValue) {
                bestValue = result.value;
                bestPath = [successor.pacmanPos, ...result.path];
            }
        }
        return { value: bestValue, path: bestPath };
    } else { // MIN (Ghosts)
        let bestValue = Infinity;
        let bestPath: Position[] = [];

        for (const action of legalActions) {
            const successor = generateAgentSuccessor(state, agentIndex, action);
            const result = minimax(successor, nextAgent, nextDepth, maxDepth, stats);
            
            if (result.value < bestValue) {
                bestValue = result.value;
                bestPath = result.path;
            }
        }
        return { value: bestValue, path: bestPath };
    }
};

// Alpha-Beta Pruning Implementation
const alphaBeta = (
    state: GameState, 
    agentIndex: number, 
    depth: number, 
    maxDepth: number, 
    alpha: number, 
    beta: number, 
    stats: SearchStats
): SearchResult => {
    stats.nodesVisited++;
    if (state.gameOver || state.win || depth === maxDepth) {
        return { value: calculateHeuristics(state).totalScore, path: [state.pacmanPos] };
    }

    const numAgents = state.ghosts.length + 1;
    const nextAgent = (agentIndex + 1) % numAgents;
    const nextDepth = nextAgent === 0 ? depth + 1 : depth;

    const legalActions = getLegalActions(state, agentIndex);
    if (legalActions.length === 0) {
         return { value: calculateHeuristics(state).totalScore, path: [state.pacmanPos] };
    }

    if (agentIndex === 0) { // MAX
        let bestValue = -Infinity;
        let bestPath: Position[] = [];

        for (const action of legalActions) {
            const successor = generateAgentSuccessor(state, agentIndex, action);
            const result = alphaBeta(successor, nextAgent, nextDepth, maxDepth, alpha, beta, stats);
            
            if (result.value > bestValue) {
                bestValue = result.value;
                bestPath = [successor.pacmanPos, ...result.path];
            }
            if (bestValue > beta) return { value: bestValue, path: bestPath };
            alpha = Math.max(alpha, bestValue);
        }
        return { value: bestValue, path: bestPath };

    } else { // MIN
        let bestValue = Infinity;
        let bestPath: Position[] = [];

        for (const action of legalActions) {
            const successor = generateAgentSuccessor(state, agentIndex, action);
            const result = alphaBeta(successor, nextAgent, nextDepth, maxDepth, alpha, beta, stats);
            
            if (result.value < bestValue) {
                bestValue = result.value;
                bestPath = result.path;
            }
            if (bestValue < alpha) return { value: bestValue, path: bestPath };
            beta = Math.min(beta, bestValue);
        }
        return { value: bestValue, path: bestPath };
    }
};

export const getBestMove = (currentState: GameState, algorithm: Algorithm = Algorithm.REFLEX): ScoredMove | null => {
    const legalActions = getLegalActions(currentState, 0);
    if (legalActions.length === 0) return null;

    const startTime = performance.now();

    // Reflex Agent (Default / Shallow)
    if (algorithm === Algorithm.REFLEX) {
        const filteredActions = legalActions.filter(a => a !== Direction.STOP);
        const actionsToEval = filteredActions.length > 0 ? filteredActions : legalActions;

        let bestMove: ScoredMove | null = null;
        let bestVal = -Infinity;
        
        const nodesVisited = actionsToEval.length; 

        for (const action of actionsToEval) {
            const successor = generateAgentSuccessor(currentState, 0, action);
            const heuristics = calculateHeuristics(successor);
            
            if (action === Direction.STOP) {
                heuristics.movementPenalty -= 100;
                heuristics.totalScore -= 100;
            }

            if (heuristics.totalScore > bestVal) {
                bestVal = heuristics.totalScore;
                bestMove = { 
                    direction: action, 
                    heuristics,
                    debugInfo: {
                        nodesVisited: 1, 
                        treeDepth: 1,
                        principalVariation: [successor.pacmanPos]
                    }
                };
            }
        }
        const endTime = performance.now();

        if (bestMove) {
             bestMove.debugInfo!.nodesVisited = nodesVisited;
             bestMove.debugInfo!.executionTimeMs = endTime - startTime;
        }
        return bestMove;
    }

    // Minimax / AlphaBeta (Depth 2)
    const MAX_DEPTH = 2;
    let bestAction: Direction | null = null;
    let bestValue = -Infinity;
    let bestPath: Position[] = [];
    
    const totalStats = { nodesVisited: 0 };

    for (const action of legalActions) {
        if (action === Direction.STOP && legalActions.length > 1) continue;
        
        const successor = generateAgentSuccessor(currentState, 0, action);
        const stats = { nodesVisited: 0 };
        let result: SearchResult;

        if (algorithm === Algorithm.MINIMAX) {
            result = minimax(successor, 1, 0, MAX_DEPTH, stats);
        } else {
            result = alphaBeta(successor, 1, 0, MAX_DEPTH, -Infinity, Infinity, stats);
        }
        
        totalStats.nodesVisited += stats.nodesVisited;

        if (result.value > bestValue) {
            bestValue = result.value;
            bestAction = action;
            bestPath = [successor.pacmanPos, ...result.path];
        }
    }

    const endTime = performance.now();

    if (bestAction) {
        return {
            direction: bestAction,
            heuristics: {
                totalScore: bestValue,
                foodScore: 0, capsuleScore: 0, ghostScore: 0, wallPenalty: 0, movementPenalty: 0, foodCountPenalty: 0
            },
            debugInfo: {
                nodesVisited: totalStats.nodesVisited,
                treeDepth: MAX_DEPTH,
                principalVariation: bestPath,
                executionTimeMs: endTime - startTime
            }
        };
    }
    
    return null;
}

export const getAllMovesHeuristics = (currentState: GameState, algorithm: Algorithm = Algorithm.REFLEX): ScoredMove[] => {
    const legalActions = getLegalActions(currentState, 0);
    const results: ScoredMove[] = [];
    const MAX_DEPTH = 2;

    for (const action of legalActions) {
        if (action === Direction.STOP && legalActions.length > 1) continue;
        
        const successor = generateAgentSuccessor(currentState, 0, action);
        
        if (algorithm === Algorithm.REFLEX) {
            const heuristics = calculateHeuristics(successor);
            results.push({ direction: action, heuristics });
        } else {
             const stats = { nodesVisited: 0 };
             let result: SearchResult;

             if (algorithm === Algorithm.MINIMAX) {
                result = minimax(successor, 1, 0, MAX_DEPTH, stats);
             } else {
                result = alphaBeta(successor, 1, 0, MAX_DEPTH, -Infinity, Infinity, stats);
             }
             
             results.push({ 
                 direction: action, 
                 heuristics: {
                     totalScore: result.value,
                     foodScore: 0, capsuleScore: 0, ghostScore: 0, wallPenalty: 0, movementPenalty: 0, foodCountPenalty: 0
                 },
                 debugInfo: {
                     nodesVisited: stats.nodesVisited,
                     treeDepth: MAX_DEPTH,
                     principalVariation: [successor.pacmanPos, ...result.path]
                 }
            });
        }
    }
    return results;
}

// New function to get stats for both algorithms for comparison visualization
export const getAlgorithmComparison = (state: GameState): { minimax: number, alphabeta: number } => {
    const legalActions = getLegalActions(state, 0);
    const MAX_DEPTH = 2;
    
    let minimaxTotal = 0;
    let alphabetaTotal = 0;

    for (const action of legalActions) {
        if (action === Direction.STOP && legalActions.length > 1) continue;
        const successor = generateAgentSuccessor(state, 0, action);
        
        // Run Minimax
        const mmStats = { nodesVisited: 0 };
        minimax(successor, 1, 0, MAX_DEPTH, mmStats);
        minimaxTotal += mmStats.nodesVisited;

        // Run AlphaBeta
        const abStats = { nodesVisited: 0 };
        alphaBeta(successor, 1, 0, MAX_DEPTH, -Infinity, Infinity, abStats);
        alphabetaTotal += abStats.nodesVisited;
    }

    return {
        minimax: minimaxTotal,
        alphabeta: alphabetaTotal
    };
};
