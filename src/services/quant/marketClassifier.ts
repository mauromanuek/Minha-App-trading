import { calculateADX, calculateEMA } from './indicators';

export type MarketRegime = 'STRONG_TREND' | 'WEAK_TREND' | 'SIDEWAYS' | 'UNKNOWN';

export interface Candle {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const classifyMarket = (candles: Candle[]): MarketRegime => {
  if (candles.length < 200) return 'UNKNOWN';

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  const adxValues = calculateADX(highs, lows, closes, 14);
  const currentADX = adxValues[adxValues.length - 1];

  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA200 = ema200[ema200.length - 1];

  // ADX Criteria
  if (currentADX < 20) {
    return 'SIDEWAYS';
  } else if (currentADX >= 20 && currentADX <= 25) {
    return 'WEAK_TREND';
  } else {
    // Check if EMA50 and EMA200 are aligned and not too close
    const emaDist = Math.abs(currentEMA50 - currentEMA200) / currentEMA200;
    if (emaDist > 0.0005) { // 0.05% distance
      return 'STRONG_TREND';
    }
    return 'WEAK_TREND';
  }
};
