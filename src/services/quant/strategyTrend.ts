import { calculateEMA, calculateRSI, calculateADX } from './indicators';
import { Candle } from './marketClassifier';

export interface TrendSignal {
  type: 'CALL' | 'PUT' | 'NONE';
  score: number;
  justification: string[];
  probability: number;
}

export const analyzeTrend = (m15Candles: Candle[], m5Candles: Candle[]): TrendSignal => {
  if (m5Candles.length < 200 || m15Candles.length < 200) {
    return { type: 'NONE', score: 0, justification: ['Not enough data'], probability: 0 };
  }

  const closes = m5Candles.map(c => c.close);
  const highs = m5Candles.map(c => c.high);
  const lows = m5Candles.map(c => c.low);

  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const adx = calculateADX(highs, lows, closes, 14);

  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA200 = ema200[ema200.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  const currentADX = adx[adx.length - 1];
  const lastCandle = m5Candles[m5Candles.length - 1];

  let callScore = 0;
  let putScore = 0;
  const callJustifications: string[] = [];
  const putJustifications: string[] = [];

  // CALL Conditions
  if (currentEMA50 > currentEMA200) {
    callScore += 20;
    callJustifications.push('EMA 50 > EMA 200');
  }
  if (currentADX > 25) {
    callScore += 20;
    callJustifications.push('ADX > 25');
  }
  if (lastCandle.low <= currentEMA50 && lastCandle.close > currentEMA50) {
    callScore += 20;
    callJustifications.push('Pullback touches EMA 50');
  }
  const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
  const body = Math.abs(lastCandle.open - lastCandle.close);
  if (lowerWick > body * 1.5) {
    callScore += 20;
    callJustifications.push('Rejection candle (long lower wick)');
  }
  if (currentRSI >= 50 && currentRSI <= 60) {
    callScore += 20;
    callJustifications.push('RSI between 50 and 60');
  }

  // PUT Conditions
  if (currentEMA50 < currentEMA200) {
    putScore += 20;
    putJustifications.push('EMA 50 < EMA 200');
  }
  if (currentADX > 25) {
    putScore += 20;
    putJustifications.push('ADX > 25');
  }
  if (lastCandle.high >= currentEMA50 && lastCandle.close < currentEMA50) {
    putScore += 20;
    putJustifications.push('Pullback touches EMA 50');
  }
  const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  if (upperWick > body * 1.5) {
    putScore += 20;
    putJustifications.push('Rejection candle (long upper wick)');
  }
  if (currentRSI >= 40 && currentRSI <= 50) {
    putScore += 20;
    putJustifications.push('RSI between 40 and 50');
  }

  if (callScore >= 80) {
    return { type: 'CALL', score: callScore, justification: callJustifications, probability: callScore * 0.9 };
  } else if (putScore >= 80) {
    return { type: 'PUT', score: putScore, justification: putJustifications, probability: putScore * 0.9 };
  }

  return { type: 'NONE', score: Math.max(callScore, putScore), justification: ['Score < 80'], probability: 0 };
};
