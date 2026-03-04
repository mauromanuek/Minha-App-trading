import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, TrendingDown, Activity, AlertCircle, Play, Square } from 'lucide-react';
import { MarketRegime } from '../services/quant/marketClassifier';
import { TrendSignal } from '../services/quant/strategyTrend';
import { DigitsSignal } from '../services/quant/strategyDigits';

interface QuantProBotProps {
  symbol: string;
  isAutoTrading: boolean;
  onToggleAutoTrade: () => void;
  quantState: {
    signal: TrendSignal | DigitsSignal | null;
    regime: MarketRegime;
    reason: string;
  };
}

const QuantProBot: React.FC<QuantProBotProps> = ({ symbol, isAutoTrading, onToggleAutoTrade, quantState }) => {
  const { regime, signal, reason } = quantState;

  const getRegimeColor = (regime: MarketRegime) => {
    switch (regime) {
      case 'STRONG_TREND': return 'text-emerald-500';
      case 'WEAK_TREND': return 'text-amber-500';
      case 'SIDEWAYS': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getRegimeLabel = (regime: MarketRegime) => {
    switch (regime) {
      case 'STRONG_TREND': return 'Tendência Forte';
      case 'WEAK_TREND': return 'Tendência Fraca';
      case 'SIDEWAYS': return 'Lateralizado';
      default: return 'Analisando...';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Quant Pro Engine
          </h2>
          <p className="text-sm text-slate-400">Alta precisão, baixa frequência.</p>
        </div>
        <button
          onClick={onToggleAutoTrade}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            isAutoTrading 
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
        >
          {isAutoTrading ? (
            <><Square className="w-5 h-5" /> Parar Robô</>
          ) : (
            <><Play className="w-5 h-5" /> Iniciar Robô</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Regime de Mercado</div>
          <div className={`text-lg font-semibold ${getRegimeColor(regime)}`}>
            {getRegimeLabel(regime)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Estratégia Ativa</div>
          <div className="text-lg font-semibold text-white">
            {regime === 'STRONG_TREND' ? 'Tendência (Pullback)' : regime === 'SIDEWAYS' ? 'Dígitos (Reversão)' : 'Aguardando'}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Status do Motor</div>
          <div className="text-sm font-medium text-slate-300 truncate" title={reason}>
            {reason}
          </div>
        </div>
      </div>

      {signal && signal.type !== 'NONE' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border ${
            signal.type === 'CALL' ? 'bg-emerald-500/10 border-emerald-500/20' : 
            signal.type === 'PUT' ? 'bg-red-500/10 border-red-500/20' : 
            'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {signal.type === 'CALL' ? <TrendingUp className="w-8 h-8 text-emerald-500" /> : 
               signal.type === 'PUT' ? <TrendingDown className="w-8 h-8 text-red-500" /> : 
               <Activity className="w-8 h-8 text-blue-500" />}
              <div>
                <div className="text-sm text-slate-400">Sinal Detectado</div>
                <div className={`text-xl font-bold ${
                  signal.type === 'CALL' ? 'text-emerald-500' : 
                  signal.type === 'PUT' ? 'text-red-500' : 
                  'text-blue-500'
                }`}>
                  {signal.type === 'DIGITDIFF' ? `Dígito Diferente de ${(signal as DigitsSignal).targetDigit}` : signal.type}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Score de Qualidade</div>
              <div className="text-2xl font-bold text-white">{signal.score}/100</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">Justificativas:</div>
            <ul className="space-y-1">
              {signal.justification.map((just, idx) => (
                <li key={idx} className="text-sm text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {just}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {(!signal || signal.type === 'NONE') && (
        <div className="p-8 rounded-xl border border-slate-700/50 bg-slate-800/20 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-medium text-slate-300">Aguardando Oportunidade</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            O motor quantitativo está analisando o mercado em tempo real. Uma operação só será aberta quando todos os critérios de alta probabilidade forem atendidos.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuantProBot;
