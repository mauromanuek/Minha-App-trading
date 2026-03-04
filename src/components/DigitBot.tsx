import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Binary, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { derivService } from '../services/derivService';
import { cn } from '../lib/utils';

interface DigitBotProps {
  symbol: string;
  isAutoTrading: boolean;
  onTrade: (type: string, barrier: number) => void;
}

const DigitBot: React.FC<DigitBotProps> = ({ symbol, isAutoTrading, onTrade }) => {
  const [lastDigits, setLastDigits] = useState<number[]>([]);
  const lastTradeTime = React.useRef<number>(0);
  
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.msg_type === 'tick' && data.tick && data.tick.symbol === symbol) {
        const digit = parseInt(data.tick.quote.toString().slice(-1));
        setLastDigits(prev => [...prev, digit].slice(-100));
      }
    };

    derivService.onMessage(handleMessage);
    return () => {};
  }, [symbol]);

  const stats = useMemo(() => {
    const counts = new Array(10).fill(0);
    lastDigits.forEach(d => counts[d]++);
    return counts.map((count, digit) => ({
      digit,
      count,
      percentage: lastDigits.length > 0 ? (count / lastDigits.length) * 100 : 0
    }));
  }, [lastDigits]);

  // Strategy: If digits 0-4 have appeared 4 times in a row, trade OVER 5
  // This is a common "reversion" strategy for digits.
  useEffect(() => {
    if (!isAutoTrading || lastDigits.length < 10) return;

    const now = Date.now();
    if (now - lastTradeTime.current < 5000) return;

    const lastFour = lastDigits.slice(-4);
    
    if (lastFour.every(d => d <= 4)) {
      onTrade('DIGITOVER', 5);
      lastTradeTime.current = now;
    } else if (lastFour.every(d => d >= 5)) {
      onTrade('DIGITUNDER', 4);
      lastTradeTime.current = now;
    }
  }, [lastDigits, isAutoTrading, onTrade]);

  return (
    <div className="space-y-6">
      <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Digit Statistics (Last 100)</h3>
          </div>
          <div className="flex gap-1">
            {lastDigits.slice(-5).map((d, i) => (
              <div key={i} className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm">
                {d}
              </div>
            ))}
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <XAxis dataKey="digit" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percentage > 15 ? '#10b981' : '#3b82f6'} fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-4">Digit Strategy: Over/Under</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Analyzes the last 100 ticks to find statistical imbalances in digit distribution.
          </p>
        </div>
        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
          <h4 className="text-[10px] font-mono text-emerald-500 uppercase mb-4">Best Performance</h4>
          <p className="text-xs text-emerald-500/70 leading-relaxed">
            Volatility 100 (1s) typically shows the most consistent digit distribution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitBot;
