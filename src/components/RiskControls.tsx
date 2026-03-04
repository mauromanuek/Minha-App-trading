import React from 'react';
import { Target, ShieldX, Coins } from 'lucide-react';
import { RiskConfig } from '../types';
import { cn } from '../lib/utils';

interface RiskControlsProps {
  config: RiskConfig;
  onChange: (config: RiskConfig) => void;
}

const RiskControls: React.FC<RiskControlsProps> = ({ config, onChange }) => {
  const updateField = (field: keyof RiskConfig, value: string) => {
    const num = parseFloat(value) || 0;
    onChange({ ...config, [field]: num });
  };

  return (
    <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-2 mb-6">
        <ShieldX className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Risk Management</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-mono mb-2">
            <Coins className="w-3 h-3" /> Stake Amount (USD)
          </label>
          <input 
            type="number"
            value={config.stake}
            onChange={(e) => updateField('stake', e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-[10px] text-rose-500 uppercase font-mono mb-2">
              <ShieldX className="w-3 h-3" /> Stop Loss
            </label>
            <input 
              type="number"
              value={config.stopLoss}
              onChange={(e) => updateField('stopLoss', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500/50"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-[10px] text-emerald-500 uppercase font-mono mb-2">
              <Target className="w-3 h-3" /> Take Profit
            </label>
            <input 
              type="number"
              value={config.takeProfit}
              onChange={(e) => updateField('takeProfit', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskControls;
