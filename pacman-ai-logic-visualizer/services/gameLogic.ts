import { CELL_TYPES, LAYOUT_STRING, SCARED_TIME } from '../constants';
import { Direction, GameState, GhostState, Position } from '../types';

export const parseLayout = (): GameState => {
  const rows = LAYOUT_STRING.trim().split('\n');
  const height = rows.length;
  const width = rows[0].length;
  
  const grid: string[][] = [];
  const walls: boolean[][] = [];
  let pacmanPos: Position = { x: 0, y: 0 };
  const ghosts: GhostState[] = [];
  const capsules: Position[] = [];
  let foodCount = 0;

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    const wallRow: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const char = rows[y][x];
      
      if (char === CELL_TYPES.WALL) {
        row.push(CELL_TYPES.WALL);
        wallRow.push(true);
      } else if (char === CELL_TYPES.FOOD) {
        row.push(CELL_TYPES.FOOD);
        wallRow.push(false);
        foodCount++;
      } else if (char === CELL_TYPES.CAPSULE) {
        row.push(CELL_TYPES.EMPTY); 
        wallRow.push(false);
        capsules.push({ x, y });
      } else if (char === CELL_TYPES.PACMAN) {
        pacmanPos = { x, y };
        row.push(CELL_TYPES.EMPTY);
        wallRow.push(false);
      } else if (char === CELL_TYPES.GHOST) {
        ghosts.push({ id: ghosts.length, position: { x, y }, scaredTimer: 0 });
        row.push(CELL_TYPES.EMPTY);
        wallRow.push(false);
      } else {
        row.push(CELL_TYPES.EMPTY);
        wallRow.push(false);
      }
    }
    grid.push(row);
    walls.push(wallRow);
  }

  return {
    grid,
    walls,
    pacmanPos,
    ghosts,
    capsules,
    score: 0,
    foodCount,
    width,
    height,
    gameOver: false,
    win: false,
  };
};

export const getNextPosition = (pos: Position, dir: Direction): Position => {
  let { x, y } = pos;
  switch (dir) {
    case Direction.NORTH: y -= 1; break;
    case Direction.SOUTH: y += 1; break;
    case Direction.EAST: x += 1; break;
    case Direction.WEST: x -= 1; break;
  }
  return { x, y };
};

export const manhattanDistance = (p1: Position, p2: Position): number => {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
};

export const getLegalActions = (state: GameState, agentIndex: number = 0): Direction[] => {
  const actions: Direction[] = [];
  const potential = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];
  
  let pos: Position;
  if (agentIndex === 0) {
    pos = state.pacmanPos;
  } else {
    // agentIndex 1 -> ghost[0]
    const ghost = state.ghosts[agentIndex - 1];
    if (!ghost) return [];
    pos = ghost.position;
  }

  for (const dir of potential) {
    const next = getNextPosition(pos, dir);
    // Check bounds and walls
    if (next.x >= 0 && next.x < state.width && next.y >= 0 && next.y < state.height) {
      if (!state.walls[next.y][next.x]) {
        actions.push(dir);
      }
    }
  }
  
  // Pacman can STOP, Ghosts usually cannot in standard rules, but we can allow it for simplicity or remove it.
  // In standard Pacman rules (and the python code), Ghosts don't STOP.
  if (agentIndex === 0) {
      actions.push(Direction.STOP);
  }

  return actions;
};

// Helper to check collision and update state accordingly
const checkCollisions = (state: GameState) => {
    for (const ghost of state.ghosts) {
        if (manhattanDistance(ghost.position, state.pacmanPos) <= 0) {
          if (ghost.scaredTimer > 0) {
            state.score += 200;
            ghost.scaredTimer = 0;
            // Respawn ghost far away or just keep it there reset. 
            // To match typical behavior, send to start box. 
            // We'll use a fixed safe spot for this sim: top right.
            ghost.position = { x: state.width - 2, y: 1 }; 
          } else {
            state.gameOver = true;
            state.score -= 500;
          }
        }
      }
}

// Generic successor function for AI search (Agent specific)
export const generateAgentSuccessor = (currentState: GameState, agentIndex: number, action: Direction): GameState => {
    if (currentState.gameOver || currentState.win) return currentState;
    
    const newState = JSON.parse(JSON.stringify(currentState)) as GameState;

    if (agentIndex === 0) {
        // --- PACMAN MOVE ---
        if (action !== Direction.STOP) {
            newState.pacmanPos = getNextPosition(newState.pacmanPos, action);
        }
        newState.score -= 1; // Time penalty

        const { x, y } = newState.pacmanPos;

        // Eat Food
        if (newState.grid[y][x] === CELL_TYPES.FOOD) {
            newState.grid[y][x] = CELL_TYPES.EMPTY;
            newState.score += 10;
            newState.foodCount--;
        }

        // Eat Capsule
        const capsuleIndex = newState.capsules.findIndex(c => c.x === x && c.y === y);
        if (capsuleIndex !== -1) {
            newState.capsules.splice(capsuleIndex, 1);
            newState.score += 200; // This value wasn't explicit in Python snippet but standard
            // Scare ghosts
            newState.ghosts.forEach(g => g.scaredTimer = SCARED_TIME);
        }
        
        // Win Check
        if (newState.foodCount === 0 && newState.capsules.length === 0) {
            newState.win = true;
            newState.score += 500;
        }

        // Collision Check
        checkCollisions(newState);

    } else {
        // --- GHOST MOVE ---
        const ghostIdx = agentIndex - 1;
        const ghost = newState.ghosts[ghostIdx];
        if (ghost) {
            if (action !== Direction.STOP) {
                ghost.position = getNextPosition(ghost.position, action);
            }
            // Decrement Timer
            if (ghost.scaredTimer > 0) ghost.scaredTimer--;
        }
        
        // Collision Check
        checkCollisions(newState);
    }

    return newState;
}

// Legacy wrapper for App.tsx main loop (Pacman Move + All Ghost Timer Decrement simulation)
// This simulates "One Turn" for Pacman, but the App handles ghost moves separately via moveGhosts.
// We just need to handle Pacman's part here.
export const generateSuccessor = (currentState: GameState, action: Direction): GameState => {
    const newState = generateAgentSuccessor(currentState, 0, action);
    // Note: We don't decrement ghost timers here because App.tsx loop handles it 
    // or moveGhosts handles it? 
    // In App.tsx: generateSuccessor(pacman) -> moveGhosts(all ghosts).
    // So we should NOT decrement ghost timers in pacman move for the GAME LOOP.
    // But generateAgentSuccessor(0) DOES decrement score.
    
    // However, the Python `generateSuccessor` (Agent 0) decrements ALL ghost timers.
    // Let's stick to: Agent 0 move = pacman move + score penalty.
    // Ghost move = position change + ghost timer decrement.
    
    // For the MAIN APP LOOP, we want Pacman to move, then Ghosts to move.
    // Ghost timers should decrement when Ghosts move.
    return newState;
};

// Simple Ghost AI (Move randomly or towards pacman) for the environment simulation
export const moveGhosts = (state: GameState): GameState => {
    let newState = JSON.parse(JSON.stringify(state)) as GameState;
    
    newState.ghosts.forEach((ghost, idx) => {
        // We use generateAgentSuccessor to ensure consistency, but we need to pick a move first.
        const agentIndex = idx + 1;
        const legal = getLegalActions(newState, agentIndex);
        
        if (legal.length > 0) {
            let chosenDir = legal[Math.floor(Math.random() * legal.length)];
            
            // Simple AI: If scared run away, else chase
            if (ghost.scaredTimer === 0) {
                // Chase
                const bestChase = legal.sort((a, b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    return manhattanDistance(posA, state.pacmanPos) - manhattanDistance(posB, state.pacmanPos);
                })[0];
                if (Math.random() > 0.2) chosenDir = bestChase; 
            } else {
                 // Run away
                 const bestRun = legal.sort((a, b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    return manhattanDistance(posB, state.pacmanPos) - manhattanDistance(posA, state.pacmanPos);
                })[0];
                if (Math.random() > 0.2) chosenDir = bestRun;
            }
            
            // Apply move using the rigorous agent successor logic
            // But wait, if we call generateAgentSuccessor repeatedly on the SAME state, we branch.
            // We need to chain them.
            // Actually, let's just use generateAgentSuccessor to compute the NEW state for this specific ghost.
            // Since generateAgentSuccessor returns a full new state, we can chain it.
        }
    });

    // To chain properly:
    for(let i=0; i<newState.ghosts.length; i++) {
        const agentIndex = i + 1;
        const ghost = newState.ghosts[i];
        const legal = getLegalActions(newState, agentIndex);
        if (legal.length > 0) {
             let chosenDir = legal[Math.floor(Math.random() * legal.length)];
             if (ghost.scaredTimer === 0) {
                const bestChase = legal.sort((a, b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    return manhattanDistance(posA, newState.pacmanPos) - manhattanDistance(posB, newState.pacmanPos);
                })[0];
                if (Math.random() > 0.2) chosenDir = bestChase; 
            } else {
                 const bestRun = legal.sort((a, b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    return manhattanDistance(posB, newState.pacmanPos) - manhattanDistance(posA, newState.pacmanPos);
                })[0];
                if (Math.random() > 0.2) chosenDir = bestRun;
            }
            newState = generateAgentSuccessor(newState, agentIndex, chosenDir);
        }
    }

    return newState;
}