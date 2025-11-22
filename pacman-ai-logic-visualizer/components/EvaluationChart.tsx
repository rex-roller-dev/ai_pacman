import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ScoredMove } from '../types';

interface EvaluationChartProps {
  moves: ScoredMove[];
}

const EvaluationChart: React.FC<EvaluationChartProps> = ({ moves }) => {
  if (!moves || moves.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">No legal moves available</div>;

  // Sort moves by best score
  const sortedMoves = [...moves].sort((a, b) => b.heuristics.totalScore - a.heuristics.totalScore);
  const bestScore = sortedMoves[0].heuristics.totalScore;

  const data = sortedMoves.map(m => ({
    direction: m.direction,
    total: m.heuristics.totalScore,
    food: m.heuristics.foodScore,
    capsule: m.heuristics.capsuleScore,
    ghost: m.heuristics.ghostScore,
    penalties: m.heuristics.wallPenalty + m.heuristics.movementPenalty + m.heuristics.foodCountPenalty
  }));

  return (
    <div className="w-full h-full bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Decision Logic Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
            <YAxis type="category" dataKey="direction" stroke="#9CA3AF" width={40} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                cursor={{fill: '#374151', opacity: 0.4}}
            />
            <Bar dataKey="food" stackId="a" fill="#F472B6" name="Food Bonus" />
            <Bar dataKey="capsule" stackId="a" fill="#A78BFA" name="Capsule Bonus" />
            <Bar dataKey="ghost" stackId="a" fill="#60A5FA" name="Ghost Logic" />
            <Bar dataKey="penalties" stackId="a" fill="#EF4444" name="Penalties" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 justify-center text-xs text-gray-400">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-pink-400"></div> Food</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-400"></div> Capsule</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400"></div> Ghost</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500"></div> Penalties</div>
      </div>
    </div>
  );
};

export default EvaluationChart;