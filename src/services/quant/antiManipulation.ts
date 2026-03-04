import { Candle } from './marketClassifier';
import { calculateADX, calculateRSI } from './indicators';

export const isManipulated = (candles: Candle[]): boolean => {
  if (candles.length < 20) return false;

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  const adx = calculateADX(highs, lows, closes, 14);
  const rsi = calculateRSI(closes, 14);

  // 1. 3 consecutive candles with large wicks on both sides
  const last3 = candles.slice(-3);
  const largeWicks = last3.every(c => {
    const body = Math.abs(c.open - c.close);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    return upperWick > body * 1.5 && lowerWick > body * 1.5;
  });

  if (largeWicks) return true;

  // 2. Spike > 2x average of last 20 candles
  const last20 = candles.slice(-20);
  const avgRange = last20.reduce((sum, c) => sum + (c.high - c.low), 0) / 20;
  const currentRange = last3[2].high - last3[2].low;
  if (currentRange > avgRange * 2) return true;

  // 3. ADX rises abruptly in 1 candle
  const currentADX = adx[adx.length - 1];
  const prevADX = adx[adx.length - 2];
  if (currentADX - prevADX > 10) return true;

  // 4. RSI goes from 30 to 70 in less than 5 candles
  const last5RSI = rsi.slice(-5);
  const minRSI = Math.min(...last5RSI);
  const maxRSI = Math.max(...last5RSI);
  if (minRSI <= 30 && maxRSI >= 70) return true;

  return false;
};
