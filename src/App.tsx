import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wallet, 
  History, 
  Settings, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { derivService } from './services/derivService';
import { Tick, HistoryPoint, Trade, Alert, BotType, RiskConfig } from './types';
import TradingChart from './components/TradingChart';
import AlertManager from './components/AlertManager';
import Sidebar from './components/Sidebar';
import RiskControls from './components/RiskControls';
import DigitBot from './components/DigitBot';
import RiseFallBot from './components/RiseFallBot';
import { cn } from './lib/utils';

const SYMBOLS = [
  { id: 'R_10', name: 'Volatility 10' },
  { id: 'R_25', name: 'Volatility 25' },
  { id: 'R_50', name: 'Volatility 50' },
  { id: 'R_75', name: 'Volatility 75' },
  { id: 'R_100', name: 'Volatility 100' },
];

export default function App() {
  const [activeBot, setActiveBot] = useState<BotType>('TREND');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [symbol, setSymbol] = useState('R_100');
  const [ticks, setTicks] = useState<HistoryPoint[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [token, setToken] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [riskConfig, setRiskConfig] = useState<RiskConfig>({
    stake: 10,
    stopLoss: 0,
    takeProfit: 0
  });
  const [autoTrade, setAutoTrade] = useState(false);
  const [isAutoTradingActive, setIsAutoTradingActive] = useState(false);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [lastSignal, setLastSignal] = useState<'CALL' | 'PUT' | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [sessionProfit, setSessionProfit] = useState(0);

  // Indicators
  const [smaShort, setSmaShort] = useState<number[]>([]);
  const [smaLong, setSmaLong] = useState<number[]>([]);

  const lastTradeTime = useRef<number>(0);

  const calculateSMA = (data: HistoryPoint[], period: number) => {
    const smas: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        smas.push(0);
        continue;
      }
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.price, 0);
      smas.push(sum / period);
    }
    return smas;
  };

  const addNotification = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, message }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const checkAlerts = useCallback((currentPrice: number, currentShort: number, currentLong: number, prevShort: number, prevLong: number) => {
    setAlerts(prev => {
      let changed = false;
      const nextAlerts = prev.map(alert => {
        if (!alert.isActive || alert.symbol !== symbol) return alert;

        let triggered = false;
        if (alert.type === 'price_above' && alert.value && currentPrice >= alert.value) triggered = true;
        if (alert.type === 'price_below' && alert.value && currentPrice <= alert.value) triggered = true;
        if (alert.type === 'sma_crossover_up' && prevShort <= prevLong && currentShort > currentLong) triggered = true;
        if (alert.type === 'sma_crossover_down' && prevShort >= prevLong && currentShort < currentLong) triggered = true;

        if (triggered) {
          changed = true;
          addNotification(`Alert Triggered: ${alert.type.replace(/_/g, ' ')} on ${alert.symbol}`);
          return { ...alert, isActive: false, triggeredAt: Date.now() };
        }
        return alert;
      });
      return changed ? nextAlerts : prev;
    });
  }, [symbol]);

  const handleTick = useCallback((tick: Tick) => {
    setTicks(prev => {
      const newTicks = [...prev, { time: tick.epoch, price: tick.quote }].slice(-100);
      
      // Calculate indicators
      const short = calculateSMA(newTicks, 7);
      const long = calculateSMA(newTicks, 25);
      setSmaShort(short);
      setSmaLong(long);

      // Update active trade current price
      setActiveTrade(current => {
        if (current && current.status === 'open') {
          return { ...current, currentPrice: tick.quote };
        }
        return current;
      });

      // Trend Detection Logic (SMA Crossover)
      if (newTicks.length > 25) {
        const lastIdx = newTicks.length - 1;
        const prevIdx = newTicks.length - 2;

        const currentShort = short[lastIdx];
        const currentLong = long[lastIdx];
        const prevShort = short[prevIdx];
        const prevLong = long[prevIdx];
        const currentPrice = newTicks[lastIdx].price;

        // Check Alerts
        checkAlerts(currentPrice, currentShort, currentLong, prevShort, prevLong);

        if (activeBot === 'TREND') {
          if (prevShort <= prevLong && currentShort > currentLong) {
            setLastSignal('CALL');
            if (isAutoTradingActive && !activeTrade) executeTrade('CALL');
          } else if (prevShort >= prevLong && currentShort < currentLong) {
            setLastSignal('PUT');
            if (isAutoTradingActive && !activeTrade) executeTrade('PUT');
          }
        }
      }

      return newTicks;
    });
  }, [isAutoTradingActive, activeTrade, checkAlerts]);

  const executeTrade = (type: string, barrier?: number) => {
    // Only one trade at a time
    if (activeTrade && activeTrade.status === 'open') {
      addNotification('Trade already in progress');
      return;
    }

    const now = Date.now();
    if (now - lastTradeTime.current < 5000) return; // 5s cooldown
    
    lastTradeTime.current = now;
    
    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type: type as any,
      entryPrice: ticks[ticks.length - 1]?.price || 0,
      currentPrice: ticks[ticks.length - 1]?.price || 0,
      amount: riskConfig.stake,
      status: 'open',
      startTime: Math.floor(now / 1000),
    };

    setActiveTrade(newTrade);
    setTrades(prev => [newTrade, ...prev].slice(0, 10));

    if (isAuthorized) {
      derivService.buyContract(symbol, riskConfig.stake, type, barrier);
    }
  };

  const stopTrading = () => {
    setIsAutoTradingActive(false);
    if (activeTrade && activeTrade.contractId) {
      derivService.sellContract(activeTrade.contractId);
      addNotification('Closing active contract...');
    }
  };

  useEffect(() => {
    derivService.connect();
    derivService.onTick(handleTick);
    derivService.onMessage((data) => {
      if (data.msg_type === 'authorize') {
        if (data.error) {
          alert('Invalid Token');
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
          setBalance(data.authorize.balance);
        }
      }
      
      // Handle contract updates
      if (data.msg_type === 'proposal_open_contract') {
        const contract = data.proposal_open_contract;
        if (contract.is_sold) {
          const profit = contract.profit;
          const status = profit > 0 ? 'won' : 'lost';
          
          setSessionProfit(prev => {
            const newProfit = prev + profit;
            // Check Risk Management
            if (riskConfig.takeProfit > 0 && newProfit >= riskConfig.takeProfit) {
              setIsAutoTradingActive(false);
              addNotification('Take Profit Reached! Stopping bot.');
            }
            if (riskConfig.stopLoss > 0 && newProfit <= -riskConfig.stopLoss) {
              setIsAutoTradingActive(false);
              addNotification('Stop Loss Reached! Stopping bot.');
            }
            return newProfit;
          });

          setActiveTrade(null); // Clear active trade
          setTrades(prev => prev.map(t => 
            t.contractId === contract.contract_id || (t.status === 'open' && t.symbol === contract.underlying)
            ? { ...t, status, profit, endTime: contract.exit_tick_time }
            : t
          ));
          
          // Update balance
          if (isAuthorized) {
            derivService.authorize(token); // Refresh balance
          }
          
          addNotification(`Contract ${status.toUpperCase()}! Profit: $${profit.toFixed(2)}`);
        } else {
          // Update contract ID for tracking
          setTrades(prev => prev.map(t => 
            t.status === 'open' && t.symbol === contract.underlying && !t.contractId
            ? { ...t, contractId: contract.contract_id }
            : t
          ));
        }
      }

      if (data.msg_type === 'buy') {
        if (data.error) {
          addNotification(`Trade Error: ${data.error.message}`);
          setActiveTrade(null);
        } else {
          const buyInfo = data.buy;
          setTrades(prev => prev.map(t => 
            t.status === 'open' && t.symbol === symbol && !t.contractId
            ? { ...t, contractId: buyInfo.contract_id }
            : t
          ));
        }
      }
    });

    return () => derivService.disconnect();
  }, [handleTick, isAuthorized, token, symbol, riskConfig]);

  const handleLogin = () => {
    if (token) {
      derivService.authorize(token);
    }
  };

  const handleAddAlert = (alertData: Omit<Alert, 'id' | 'isActive'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: Math.random().toString(36).substr(2, 9),
      isActive: true,
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 flex">
      {/* Sidebar */}
      <Sidebar 
        activeBot={activeBot}
        onBotChange={(bot) => {
          setActiveBot(bot);
          setIsAutoTradingActive(false);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-72" : "ml-0 lg:ml-20"
      )}>
        {/* Notifications Overlay */}
        <div className="fixed top-20 right-6 z-[100] space-y-2 pointer-events-none">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-500 text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto border border-white/20"
              >
                <Bell className="w-4 h-4 fill-current" />
                <span className="text-xs font-bold">{n.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Header */}
        <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="text-black w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight uppercase">
                  {activeBot.replace('_', ' ')} BOT
                </h1>
                <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Active Trading Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-mono uppercase">Session Profit</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-mono text-lg font-bold",
                    sessionProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-mono uppercase">Balance</span>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-lg font-bold">
                    {balance !== null ? `$${balance.toLocaleString()}` : '---'}
                  </span>
                </div>
              </div>
              {!isAuthorized ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="password" 
                    placeholder="API Token" 
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <button 
                    onClick={handleLogin}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                  >
                    Connect
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthorized(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
          {/* Left Column: Chart & Controls */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Market Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {SYMBOLS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    derivService.unsubscribeTicks(symbol);
                    setSymbol(s.id);
                    setTicks([]);
                    derivService.subscribeTicks(s.id);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all whitespace-nowrap",
                    symbol === s.id 
                      ? "bg-emerald-500 border-emerald-500 text-black font-bold" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Bot Specific View */}
            {activeBot === 'TREND' && (
              <>
                <TradingChart 
                  data={ticks} 
                  symbol={symbol} 
                  smaShort={smaShort} 
                  smaLong={smaLong} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => executeTrade('CALL')}
                    className="group relative overflow-hidden bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-2xl p-6 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-emerald-500 text-xs font-mono uppercase mb-1">Rise Signal</p>
                        <h3 className="text-2xl font-bold">BUY CALL</h3>
                      </div>
                      <TrendingUp className="w-8 h-8 text-emerald-500" />
                    </div>
                  </button>
                  <button 
                    onClick={() => executeTrade('PUT')}
                    className="group relative overflow-hidden bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-2xl p-6 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-rose-500 text-xs font-mono uppercase mb-1">Fall Signal</p>
                        <h3 className="text-2xl font-bold">BUY PUT</h3>
                      </div>
                      <TrendingDown className="w-8 h-8 text-rose-500" />
                    </div>
                  </button>
                </div>
              </>
            )}

            {activeBot === 'DIGIT' && (
              <DigitBot 
                symbol={symbol} 
                isAutoTrading={isAutoTradingActive} 
                onTrade={(type, barrier) => executeTrade(type, barrier)} 
              />
            )}

            {activeBot === 'RISE_FALL' && (
              <RiseFallBot 
                ticks={ticks} 
                isAutoTrading={isAutoTradingActive} 
                onTrade={(type) => executeTrade(type)} 
              />
            )}
          </div>

          {/* Right Column: Stats & Alerts */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Risk Controls */}
            <RiskControls config={riskConfig} onChange={setRiskConfig} />

            {/* Trading Config */}
            <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Bot Controls</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-sm font-bold">Auto-Trading Mode</h4>
                    <p className="text-[10px] text-gray-500">Enable strategy engine</p>
                  </div>
                  <button 
                    onClick={() => {
                      setAutoTrade(!autoTrade);
                      if (autoTrade) stopTrading();
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      autoTrade ? "bg-emerald-500" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      autoTrade ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                {autoTrade && (
                  <button
                    onClick={() => {
                      if (isAutoTradingActive) stopTrading();
                      else setIsAutoTradingActive(true);
                    }}
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      isAutoTradingActive 
                        ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20" 
                        : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                    )}
                  >
                    {isAutoTradingActive ? (
                      <>
                        <Activity className="w-4 h-4 animate-pulse" />
                        STOP TRADING & CLOSE
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        START AUTO-TRADING
                      </>
                    )}
                  </button>
                )}
              </div>

              {activeTrade && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-xl border bg-[#1a1b1e] border-emerald-500/30 shadow-xl shadow-emerald-500/5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-ping",
                        activeTrade.type === 'CALL' ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <span className="text-[10px] font-mono uppercase text-gray-400">Active Contract</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Entry Price</p>
                      <p className="text-sm font-mono font-bold">{activeTrade.entryPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Current Price</p>
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        activeTrade.currentPrice && (
                          activeTrade.type === 'CALL' 
                            ? activeTrade.currentPrice > activeTrade.entryPrice ? "text-emerald-500" : "text-rose-500"
                            : activeTrade.currentPrice < activeTrade.entryPrice ? "text-emerald-500" : "text-rose-500"
                        )
                      )}>
                        {activeTrade.currentPrice?.toFixed(2) || '---'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                        activeTrade.type === 'CALL' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                      )}>
                        {activeTrade.type}
                      </div>
                      <span className="text-xs font-bold">${activeTrade.amount}</span>
                    </div>
                    <div className={cn(
                      "text-xs font-bold flex items-center gap-1",
                      activeTrade.currentPrice && (
                        activeTrade.type === 'CALL' 
                          ? activeTrade.currentPrice > activeTrade.entryPrice ? "text-emerald-500" : "text-rose-500"
                          : activeTrade.currentPrice < activeTrade.entryPrice ? "text-emerald-500" : "text-rose-500"
                      )
                    )}>
                      {activeTrade.currentPrice && (
                        activeTrade.type === 'CALL' 
                          ? activeTrade.currentPrice > activeTrade.entryPrice ? "WINNING" : "LOSING"
                          : activeTrade.currentPrice < activeTrade.entryPrice ? "WINNING" : "LOSING"
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {lastSignal && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between",
                  lastSignal === 'CALL' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <Activity className={cn("w-5 h-5", lastSignal === 'CALL' ? "text-emerald-500" : "text-rose-500")} />
                  <div>
                    <p className="text-[10px] uppercase font-mono opacity-60">Active Signal</p>
                    <p className="font-bold">{lastSignal === 'CALL' ? 'BULLISH TREND' : 'BEARISH TREND'}</p>
                  </div>
                </div>
                {lastSignal === 'CALL' ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-rose-500" />}
              </motion.div>
            )}

            {/* Alert Manager */}
            <AlertManager 
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              symbol={symbol}
              currentPrice={ticks[ticks.length - 1]?.price || 0}
            />

            {/* Trade History */}
            <div className="bg-[#151619] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Recent Activity</h3>
              </div>
              <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {trades.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No active trades</p>
                  </div>
                ) : (
                  trades.map((trade) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          trade.type === 'CALL' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                        )}>
                          {trade.type === 'CALL' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{trade.symbol}</p>
                          <p className="text-[10px] text-gray-500 font-mono">${trade.amount} • {trade.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono">${trade.entryPrice.toFixed(2)}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-mono">
                          Pending
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-[10px] text-emerald-500/70 leading-relaxed">
              This application uses the official Deriv API (App ID: 121512). 
              Your API token is only used for session authorization and is never stored on our servers.
            </p>
          </div>
        </div>
      </main>

    </div>

      {/* Footer Status */}
      <footer className="fixed bottom-0 w-full bg-[#0a0a0a] border-t border-white/5 px-6 py-2 flex items-center justify-between text-[10px] font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>API CONNECTED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            <span>LATENCY: 42ms</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>SERVER TIME: {new Date().toLocaleTimeString()}</span>
          <span className="text-emerald-500/50">v1.1.0-stable</span>
        </div>
      </footer>
    </div>
  );
}
