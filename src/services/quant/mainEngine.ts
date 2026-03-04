import { classifyMarket, MarketRegime, Candle } from './marketClassifier';
import { analyzeTrend, TrendSignal } from './strategyTrend';
import { analyzeDigits, DigitsSignal } from './strategyDigits';
import { isManipulated } from './antiManipulation';
import { RiskManager, RiskConfig, TradeResult } from './riskManager';

export interface QuantEngineConfig {
  riskConfig: RiskConfig;
  initialBalance: number;
}

export class QuantEngine {
  private riskManager: RiskManager;
  private m15Candles: Candle[] = [];
  private m5Candles: Candle[] = [];
  private ticks: number[] = [];
  private manipulationCooldown: number = 0;

  constructor(config: QuantEngineConfig) {
    this.riskManager = new RiskManager(config.riskConfig, config.initialBalance);
  }

  public updateData(m15: Candle[], m5: Candle[], ticks: number[]) {
    this.m15Candles = m15;
    this.m5Candles = m5;
    this.ticks = ticks;
  }

  public updateBalance(balance: number) {
    this.riskManager.updateBalance(balance);
  }

  public registerTradeResult(result: TradeResult) {
    this.riskManager.registerTrade(result);
  }

  public evaluate(): { signal: TrendSignal | DigitsSignal | null; regime: MarketRegime; reason: string } {
    const riskCheck = this.riskManager.canTrade();
    if (!riskCheck.allowed) {
      return { signal: null, regime: 'UNKNOWN', reason: riskCheck.reason || 'Risk limit reached' };
    }

    if (this.manipulationCooldown > 0) {
      this.manipulationCooldown--;
      return { signal: null, regime: 'UNKNOWN', reason: 'Anti-manipulation cooldown active' };
    }

    if (isManipulated(this.m5Candles)) {
      this.manipulationCooldown = 5;
      return { signal: null, regime: 'UNKNOWN', reason: 'Market manipulation detected. Waiting 5 candles.' };
    }

    const regime = classifyMarket(this.m15Candles);

    if (regime === 'WEAK_TREND') {
      return { signal: null, regime, reason: 'Weak trend detected. Not trading.' };
    }

    if (regime === 'STRONG_TREND') {
      const trendSignal = analyzeTrend(this.m15Candles, this.m5Candles);
      if (trendSignal.type !== 'NONE') {
        return { signal: trendSignal, regime, reason: 'Strong trend signal found' };
      }
      return { signal: null, regime, reason: 'No valid trend signal' };
    }

    if (regime === 'SIDEWAYS') {
      const digitsSignal = analyzeDigits(this.ticks);
      if (digitsSignal.type !== 'NONE') {
        return { signal: digitsSignal, regime, reason: 'Digits signal found' };
      }
      return { signal: null, regime, reason: 'No valid digits signal' };
    }

    return { signal: null, regime, reason: 'Unknown market regime' };
  }

  public getStake(): number {
    return this.riskManager.getStake();
  }
}
