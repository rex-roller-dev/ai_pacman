
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parseLayout, generateSuccessor, moveGhosts } from './services/gameLogic';
import { getBestMove, getAllMovesHeuristics, getAlgorithmComparison } from './services/aiAgents';
import PacmanBoard from './components/PacmanBoard';
import EvaluationChart from './components/EvaluationChart';
import { GameState, ScoredMove, Algorithm, Position } from './types';
import { Play, Pause, SkipForward, RotateCcw, BrainCircuit, Zap, Settings, Activity, TrendingUp, Timer, BarChart2 } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [evaluatedMoves, setEvaluatedMoves] = useState<ScoredMove[]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.REFLEX);
  const [comparisonStats, setComparisonStats] = useState<{ minimax: number, alphabeta: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [currentBestMove, setCurrentBestMove] = useState<ScoredMove | null>(null);

  // Initial Load
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate heuristics and comparison when algorithm or state changes
  useEffect(() => {
      if (gameState && !gameState.gameOver && !gameState.win) {
          const moves = getAllMovesHeuristics(gameState, algorithm);
          setEvaluatedMoves(moves);
          const best = getBestMove(gameState, algorithm);
          setCurrentBestMove(best);

          // Run comparison if we are in an advanced mode or want to show the potential
          // This runs in background to populate the comparison chart
          if (algorithm !== Algorithm.REFLEX) {
             const stats = getAlgorithmComparison(gameState);
             setComparisonStats(stats);
          } else {
             setComparisonStats(null);
          }
      }
  }, [algorithm, gameState]);

  const resetGame = () => {
    const initial = parseLayout();
    setGameState(initial);
    const moves = getAllMovesHeuristics(initial, algorithm);
    setEvaluatedMoves(moves);
    setCurrentBestMove(getBestMove(initial, algorithm));
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver || prev.win) {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return prev;
      }

      // 1. AI Decides Move
      const bestMove = getBestMove(prev, algorithm);
      setCurrentBestMove(bestMove);
      
      let nextState = prev;
      if (bestMove) {
        nextState = generateSuccessor(prev, bestMove.direction);
      }

      // 2. Ghosts Move
      nextState = moveGhosts(nextState);

      return nextState;
    });
  }, [algorithm]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(gameLoop, 400);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameLoop]);

  const handleStep = () => {
    setIsPlaying(false);
    gameLoop();
  };

  if (!gameState) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
            <BrainCircuit className="text-pink-500" /> 
            Pacman AI Visualizer
          </h1>
          <p className="text-gray-400 text-sm mt-1">Visualizing Search Algorithms & Heuristics</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 items-center">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 shadow-md">
                <Settings size={16} className="text-gray-400" />
                <select 
                    value={algorithm} 
                    onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                    className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
                >
                    <option value={Algorithm.REFLEX}>Reflex Agent</option>
                    <option value={Algorithm.MINIMAX}>Minimax (Depth 2)</option>
                    <option value={Algorithm.ALPHABETA}>Alpha-Beta (Depth 2)</option>
                </select>
            </div>

            <div className="flex items-center gap-6 bg-gray-800 px-6 py-2 rounded-lg border border-gray-700 shadow-md">
                <div className="text-center">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Score</span>
                    <span className="text-2xl font-mono font-bold text-white">{gameState.score}</span>
                </div>
                <div className="h-8 w-px bg-gray-600"></div>
                <div className="text-center">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Status</span>
                    <span className={`text-lg font-bold ${gameState.gameOver ? 'text-red-500' : gameState.win ? 'text-green-500' : 'text-blue-400'}`}>
                        {gameState.gameOver ? "GAME OVER" : gameState.win ? "VICTORY" : "RUNNING"}
                    </span>
                </div>
            </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl">
        
        {/* Left Column: Board and Controls */}
        <div className="flex-1 flex flex-col items-center gap-6">
          <PacmanBoard 
            gameState={gameState} 
            evaluatedMoves={evaluatedMoves} 
            predictedPath={currentBestMove?.debugInfo?.principalVariation} 
          />
          
          <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-full shadow-lg border border-gray-700">
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={gameState.gameOver || gameState.win}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? "Pause" : "Auto Play"}
            </button>

            <button 
                onClick={handleStep}
                disabled={gameState.gameOver || gameState.win || isPlaying}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Step Forward"
            >
                <SkipForward size={18} />
            </button>

            <button 
                onClick={resetGame}
                className="p-3 rounded-full bg-gray-700 hover:bg-red-900/50 text-red-400 hover:text-red-300"
                title="Reset Game"
            >
                <RotateCcw size={18} />
            </button>
          </div>
          
          {algorithm !== Algorithm.REFLEX && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <TrendingUp size={14} />
                <span>Green dashed line shows Pacman's planned future path (2 steps ahead)</span>
            </div>
          )}
        </div>

        {/* Right Column: Analytics */}
        <div className="flex-1 w-full lg:max-w-md flex flex-col gap-6">
            
            {/* Performance Comparison Card */}
            {comparisonStats && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                            <BarChart2 size={16} className="text-purple-400"/> 
                            Efficiency Comparison
                        </h2>
                        <div className="text-[10px] text-gray-400">Lower is Better</div>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">Minimax Nodes</span>
                                <span className="text-purple-300 font-mono">{comparisonStats.minimax}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500/50" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-white font-bold">Alpha-Beta Nodes</span>
                                <span className="text-green-400 font-mono font-bold">{comparisonStats.alphabeta}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500" 
                                    style={{ width: `${Math.max(1, (comparisonStats.alphabeta / comparisonStats.minimax) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 text-center text-xs text-green-300 bg-green-900/20 py-2 rounded border border-green-800/30">
                        <span className="font-bold">{(100 - (comparisonStats.alphabeta / comparisonStats.minimax) * 100).toFixed(1)}%</span> of tree pruned (skipped)
                    </div>
                </div>
            )}

            {/* Current Decision Metrics */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap size={18} className="text-yellow-400"/> 
                        Current Decision
                    </h2>
                </div>
                
                {currentBestMove ? (
                    <div className="space-y-4">
                         {/* Stats Grid */}
                         <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                    <Activity size={12} /> Nodes Visited
                                </div>
                                <div className="text-xl font-mono font-bold text-blue-400">
                                    {currentBestMove.debugInfo?.nodesVisited ?? 1}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                    <Timer size={12} /> Time (ms)
                                </div>
                                <div className={`text-xl font-mono font-bold ${(currentBestMove.debugInfo?.executionTimeMs || 0) > 10 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {currentBestMove.debugInfo?.executionTimeMs?.toFixed(2) ?? "< 0.1"}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                            <span className="text-gray-400 text-sm">Chosen Action</span>
                            <span className="text-xl font-bold text-yellow-400">{currentBestMove.direction}</span>
                        </div>
                        
                        {algorithm === Algorithm.REFLEX ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1">Food Bonus</div>
                                    <div className="text-lg font-mono text-pink-400">
                                        {currentBestMove.heuristics.foodScore.toFixed(1)}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1">Ghost Weight</div>
                                    <div className="text-lg font-mono text-blue-400">
                                        {currentBestMove.heuristics.ghostScore.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-900/50 rounded-lg text-center border border-gray-800">
                                <div className="text-xs text-gray-500 mb-2">Tree Search Value</div>
                                <div className="text-3xl font-mono font-bold text-purple-400">
                                    {currentBestMove.heuristics.totalScore.toFixed(1)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 italic text-center py-8">Thinking...</p>
                )}
            </div>

            {/* Chart */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg h-[240px]">
                <EvaluationChart moves={evaluatedMoves} />
            </div>
            
        </div>

      </main>
    </div>
  );
};

export default App;
