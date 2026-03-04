export interface Tick {
  epoch: number;
  quote: number;
  symbol: string;
}

export interface HistoryPoint {
  time: number;
  price: number;
}

export type BotType = 'TREND' | 'DIGIT' | 'RISE_FALL';

export interface RiskConfig {
  stopLoss: number;
  takeProfit: number;
  stake: number;
}

export interface Trade {
  id: string;
  contractId?: number;
  symbol: string;
  type: 'CALL' | 'PUT';
  entryPrice: number;
  currentPrice?: number;
  amount: number;
  status: 'open' | 'won' | 'lost';
  startTime: number;
  endTime?: number;
  profit?: number;
}

export interface DerivConfig {
  appId: string;
  token?: string;
}

export interface Alert {
  id: string;
  type: 'price_above' | 'price_below' | 'sma_crossover_up' | 'sma_crossover_down';
  value?: number;
  symbol: string;
  isActive: boolean;
  triggeredAt?: number;
}
