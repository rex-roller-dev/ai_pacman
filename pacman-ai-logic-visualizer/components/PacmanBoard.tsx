
import React from 'react';
import { CELL_TYPES } from '../constants';
import { GameState, Direction, ScoredMove, Position } from '../types';
import { Ghost, Zap } from 'lucide-react';

interface PacmanBoardProps {
  gameState: GameState;
  evaluatedMoves: ScoredMove[];
  predictedPath?: Position[];
}

const PacmanBoard: React.FC<PacmanBoardProps> = ({ gameState, evaluatedMoves, predictedPath }) => {
  const { grid, pacmanPos, ghosts, walls, capsules } = gameState;
  const width = gameState.width;
  const height = gameState.height;
  const cellSize = 30;

  const getCellContent = (x: number, y: number) => {
    // 1. Ghosts
    const ghost = ghosts.find(g => g.position.x === x && g.position.y === y);
    if (ghost) {
      return (
        <div className={`relative flex items-center justify-center w-full h-full transition-colors duration-300 ${ghost.scaredTimer > 0 ? 'text-blue-300' : 'text-red-500'} z-20`}>
            {ghost.scaredTimer > 0 ? <Zap size={20} className="animate-pulse" /> : <Ghost size={20} />}
        </div>
      );
    }

    // 2. Pacman
    if (pacmanPos.x === x && pacmanPos.y === y) {
      return (
        <div className="relative flex items-center justify-center w-full h-full text-yellow-400 z-30">
            <div className="w-5 h-5 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                 <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full"></div> 
            </div>
        </div>
      );
    }

    // 3. Walls
    if (walls[y][x]) {
        return <div className="w-full h-full bg-blue-900 border border-blue-800 rounded-sm shadow-inner"></div>;
    }

    // 4. Capsules
    const isCapsule = capsules.some(c => c.x === x && c.y === y);
    if (isCapsule) {
        return <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(244,114,182,0.8)]"></div>;
    }

    // 5. Food
    if (grid[y][x] === CELL_TYPES.FOOD) {
      return <div className="w-1.5 h-1.5 bg-pink-200/70 rounded-full"></div>;
    }

    return null;
  };

  const getOverlay = (x: number, y: number) => {
      let move = evaluatedMoves.find(m => {
          let targetX = pacmanPos.x;
          let targetY = pacmanPos.y;
          if (m.direction === Direction.NORTH) targetY--;
          if (m.direction === Direction.SOUTH) targetY++;
          if (m.direction === Direction.EAST) targetX++;
          if (m.direction === Direction.WEST) targetX--;
          return targetX === x && targetY === y;
      });

      if (move) {
          const score = Math.round(move.heuristics.totalScore);
          const isBest = Math.max(...evaluatedMoves.map(m => m.heuristics.totalScore)) === move.heuristics.totalScore;
          
          return (
              <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold opacity-90 z-40 pointer-events-none
                  ${isBest ? 'bg-green-500/40 text-white scale-110 ring-2 ring-green-400' : 'bg-gray-700/50 text-gray-200'}
                  transition-all duration-200
              `}>
                  {score}
              </div>
          )
      }
      return null;
  };

  // Generate SVG Path string for the predicted path
  const getPathSvg = () => {
      if (!predictedPath || predictedPath.length === 0) return null;
      
      // Start from center of Pacman's current cell
      const startX = pacmanPos.x * cellSize + cellSize / 2;
      const startY = pacmanPos.y * cellSize + cellSize / 2;
      
      let d = `M ${startX} ${startY}`;
      predictedPath.forEach(pos => {
          const px = pos.x * cellSize + cellSize / 2;
          const py = pos.y * cellSize + cellSize / 2;
          d += ` L ${px} ${py}`;
      });

      return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#34D399" />
                </marker>
            </defs>
            <path 
                d={d} 
                stroke="#34D399" 
                strokeWidth="3" 
                strokeDasharray="5,5"
                fill="none" 
                markerEnd="url(#arrowhead)"
                className="drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"
            />
            {predictedPath.map((pos, i) => (
                <circle 
                    key={i} 
                    cx={pos.x * cellSize + cellSize / 2} 
                    cy={pos.y * cellSize + cellSize / 2} 
                    r="3" 
                    fill="#34D399"
                />
            ))}
        </svg>
      );
  };

  return (
    <div className="relative inline-block bg-black p-4 rounded-xl border-4 border-blue-900 shadow-2xl">
      <div className="relative">
        <div 
            className="grid gap-0"
            style={{
                gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${height}, ${cellSize}px)`
            }}
        >
            {grid.map((row, y) => 
            row.map((col, x) => (
                <div key={`${x}-${y}`} className="relative w-[30px] h-[30px] flex items-center justify-center bg-gray-950 border-[0.5px] border-white/5">
                {getCellContent(x, y)}
                {getOverlay(x, y)}
                </div>
            ))
            )}
        </div>
        {getPathSvg()}
      </div>
    </div>
  );
};

export default PacmanBoard;
