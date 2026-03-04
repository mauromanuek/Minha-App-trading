import React, { useState } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, X, Zap } from 'lucide-react';
import { Alert } from '../types';
import { cn } from '../lib/utils';

interface AlertManagerProps {
  alerts: Alert[];
  onAddAlert: (alert: Omit<Alert, 'id' | 'isActive'>) => void;
  onDeleteAlert: (id: string) => void;
  symbol: string;
  currentPrice: number;
}

const AlertManager: React.FC<AlertManagerProps> = ({ alerts, onAddAlert, onDeleteAlert, symbol, currentPrice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState<Alert['type']>('price_above');
  const [newAlertValue, setNewAlertValue] = useState<string>('');

  const handleAdd = () => {
    onAddAlert({
      type: newAlertType,
      value: newAlertType.includes('price') ? parseFloat(newAlertValue) : undefined,
      symbol,
    });
    setNewAlertValue('');
  };

  return (
    <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Market Alerts</h3>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-emerald-500"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-mono mb-2">Alert Type</label>
            <select 
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
              value={newAlertType}
              onChange={(e) => setNewAlertType(e.target.value as Alert['type'])}
            >
              <option value="price_above">Price Above</option>
              <option value="price_below">Price Below</option>
              <option value="sma_crossover_up">SMA Crossover Up</option>
              <option value="sma_crossover_down">SMA Crossover Down</option>
            </select>
          </div>

          {newAlertType.includes('price') && (
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-mono mb-2">Target Price (Current: {currentPrice.toFixed(2)})</label>
              <input 
                type="number"
                step="0.01"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                placeholder="Enter price..."
                value={newAlertValue}
                onChange={(e) => setNewAlertValue(e.target.value)}
              />
            </div>
          )}

          <button 
            onClick={handleAdd}
            disabled={newAlertType.includes('price') && !newAlertValue}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black py-2 rounded-lg text-xs font-bold transition-all"
          >
            Create Alert
          </button>
        </div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-600 font-mono">No active alerts</p>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between group transition-all",
                alert.triggeredAt ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  alert.type.includes('above') || alert.type.includes('up') ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {alert.type === 'price_above' && <TrendingUp className="w-4 h-4" />}
                  {alert.type === 'price_below' && <TrendingDown className="w-4 h-4" />}
                  {alert.type === 'sma_crossover_up' && <Zap className="w-4 h-4" />}
                  {alert.type === 'sma_crossover_down' && <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase text-gray-300">
                    {alert.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {alert.symbol} {alert.value ? `@ ${alert.value}` : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onDeleteAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all text-gray-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertManager;
