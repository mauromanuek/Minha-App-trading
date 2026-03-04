import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { HistoryPoint } from '../types';

interface TradingChartProps {
  data: HistoryPoint[];
  symbol: string;
  smaShort: number[];
  smaLong: number[];
}

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol, smaShort, smaLong }) => {
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      ...point,
      timeStr: format(point.time * 1000, 'HH:mm:ss'),
      smaShort: smaShort[index] || null,
      smaLong: smaLong[index] || null,
    }));
  }, [data, smaShort, smaLong]);

  const domain = useMemo(() => {
    if (data.length === 0) return [0, 0];
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [data]);

  return (
    <div className="w-full h-[400px] bg-[#151619] rounded-xl p-4 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-mono text-sm uppercase tracking-wider">{symbol} Real-time</h3>
        <div className="flex gap-4 text-[10px] font-mono uppercase text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            Price
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            SMA 7
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            SMA 25
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis 
            dataKey="timeStr" 
            stroke="#ffffff20" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={domain} 
            orientation="right" 
            stroke="#ffffff20" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toFixed(2)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #ffffff10', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#666' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="smaShort" 
            stroke="#3b82f6" 
            fill="transparent" 
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="smaLong" 
            stroke="#f97316" 
            fill="transparent" 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;
