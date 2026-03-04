import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { HistoryPoint } from '../types';
import { cn } from '../lib/utils';

interface RiseFallBotProps {
  ticks: HistoryPoint[];
  isAutoTrading: boolean;
  onTrade: (type: 'CALL' | 'PUT') => void;
}

const RiseFallBot: React.FC<RiseFallBotProps> = ({ ticks, isAutoTrading, onTrade }) => {
  const [momentum, setMomentum] = useState(0);

  useEffect(() => {
    if (ticks.length < 5) return;

    const lastTicks = ticks.slice(-5);
    let upCount = 0;
    let downCount = 0;

    for (let i = 1; i < lastTicks.length; i++) {
      if (lastTicks[i].price > lastTicks[i-1].price) upCount++;
      else if (lastTicks[i].price < lastTicks[i-1].price) downCount++;
    }

    setMomentum(upCount - downCount);

    if (isAutoTrading) {
      if (upCount >= 4) onTrade('CALL');
      else if (downCount >= 4) onTrade('PUT');
    }
  }, [ticks, isAutoTrading, onTrade]);

  return (
    <div className="space-y-6">
      <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Momentum Scalper</h3>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] font-mono text-gray-500">5 TICK ANALYSIS</span>
          </div>
        </div>

        <div className="flex items-center justify-center h-32">
          <div className="relative w-full max-w-xs h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 h-full transition-all duration-300",
                momentum > 0 ? "bg-emerald-500 left-1/2" : "bg-rose-500 right-1/2"
              )}
              style={{ width: `${Math.abs(momentum) * 12.5}%` }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/20" />
          </div>
        </div>

        <div className="flex justify-between text-[10px] font-mono uppercase mt-2">
          <span className="text-rose-500">Strong Bearish</span>
          <span className="text-gray-500">Neutral</span>
          <span className="text-emerald-500">Strong Bullish</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[10px] font-mono text-gray-500 uppercase">Scalping Strategy</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Detects micro-trends by analyzing tick-by-tick momentum. Executes trades when 4 out of 5 ticks move in the same direction.
          </p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h4 className="text-[10px] font-mono text-gray-500 uppercase">Tick Duration</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Optimized for 5-tick contracts. High frequency, high precision entry points.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiseFallBot;
