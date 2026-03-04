export const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

export const calculateRSI = (data: number[], period: number = 14): number[] => {
  const rsi = new Array(data.length).fill(0);
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
  }

  return rsi;
};

export const calculateADX = (highs: number[], lows: number[], closes: number[], period: number = 14): number[] => {
  const adx = new Array(closes.length).fill(0);
  if (closes.length <= period * 2) return adx;

  const tr = [0];
  const plusDM = [0];
  const minusDM = [0];

  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hc, lc));

    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  let trSum = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let plusDMSum = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let minusDMSum = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

  const dx = new Array(closes.length).fill(0);

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      trSum = trSum - (trSum / period) + tr[i];
      plusDMSum = plusDMSum - (plusDMSum / period) + plusDM[i];
      minusDMSum = minusDMSum - (minusDMSum / period) + minusDM[i];
    }

    const plusDI = (plusDMSum / trSum) * 100;
    const minusDI = (minusDMSum / trSum) * 100;

    const diDiff = Math.abs(plusDI - minusDI);
    const diSum = plusDI + minusDI;
    dx[i] = diSum === 0 ? 0 : (diDiff / diSum) * 100;
  }

  let adxSum = dx.slice(period, period * 2).reduce((a, b) => a + b, 0);
  adx[period * 2 - 1] = adxSum / period;

  for (let i = period * 2; i < closes.length; i++) {
    adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
  }

  return adx;
};
