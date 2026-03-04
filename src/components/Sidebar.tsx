import React from 'react';
import { 
  LayoutDashboard, 
  Binary, 
  Zap, 
  Menu, 
  X, 
  ChevronRight,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { BotType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeBot: BotType;
  onBotChange: (bot: BotType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeBot, onBotChange, isOpen, onToggle }) => {
  const bots = [
    { id: 'QUANT_PRO', name: 'Quant Pro', icon: ShieldAlert, desc: 'Institutional AI Engine' },
    { id: 'TREND', name: 'Trend Master', icon: LayoutDashboard, desc: 'SMA Crossover Strategy' },
    { id: 'DIGIT', name: 'Digit Analyzer', icon: Binary, desc: 'Fast Digit Statistics' },
    { id: 'RISE_FALL', name: 'Rise/Fall Scalper', icon: Zap, desc: 'Quick Tick Scalping' },
  ] as const;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-[#0d0e12] border-r border-white/5 z-[70] transition-all duration-300 ease-in-out",
        isOpen ? "w-72" : "w-0 lg:w-20 overflow-hidden"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
            <BarChart3 className="w-6 h-6 text-emerald-500 shrink-0" />
            {isOpen && <span className="ml-3 font-bold tracking-tight text-sm">BOT FACTORY</span>}
          </div>

          {/* Bot List */}
          <nav className="flex-1 py-6 px-3 space-y-2">
            {bots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => onBotChange(bot.id)}
                className={cn(
                  "w-full flex items-center p-3 rounded-xl transition-all group",
                  activeBot === bot.id 
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <bot.icon className={cn("w-5 h-5 shrink-0", activeBot === bot.id ? "text-black" : "text-emerald-500")} />
                {isOpen && (
                  <div className="ml-3 text-left">
                    <p className="text-xs font-bold leading-none">{bot.name}</p>
                    <p className={cn("text-[10px] mt-1 opacity-60", activeBot === bot.id ? "text-black" : "text-gray-500")}>
                      {bot.desc}
                    </p>
                  </div>
                )}
                {isOpen && activeBot === bot.id && <ChevronRight className="ml-auto w-4 h-4" />}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10",
              !isOpen && "justify-center"
            )}>
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              {isOpen && (
                <div>
                  <p className="text-[10px] font-bold text-rose-500 uppercase">Risk Warning</p>
                  <p className="text-[9px] text-rose-500/60 leading-tight">Trading involves high risk.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
