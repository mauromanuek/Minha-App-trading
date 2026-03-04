export interface DigitsSignal {
  type: 'DIGITDIFF' | 'NONE';
  targetDigit?: number;
  score: number;
  justification: string[];
  probability: number;
}

export const analyzeDigits = (ticks: number[]): DigitsSignal => {
  if (ticks.length < 1000) {
    return { type: 'NONE', score: 0, justification: ['Not enough ticks (need 1000)'], probability: 0 };
  }

  const last1000 = ticks.slice(-1000);
  const counts = new Array(10).fill(0);
  last1000.forEach(t => {
    const digit = parseInt(t.toString().slice(-1));
    if (!isNaN(digit)) counts[digit]++;
  });

  const frequencies = counts.map(c => (c / 1000) * 100);
  const expectedFreq = 10;
  
  // Find deviations > 6%
  const deviations = frequencies.map((f, i) => ({ digit: i, dev: Math.abs(f - expectedFreq) }));
  const maxDev = deviations.reduce((prev, current) => (prev.dev > current.dev) ? prev : current);

  // Check last 5 digits
  const last5 = last1000.slice(-5).map(t => parseInt(t.toString().slice(-1)));
  const allSame = last5.every(d => d === last5[0]);

  if (allSame && maxDev.dev > 6) {
    return {
      type: 'DIGITDIFF',
      targetDigit: last5[0],
      score: 90,
      justification: [`Digit ${last5[0]} appeared 5 times in a row`, `Deviation > 6% (${maxDev.dev.toFixed(2)}%)`],
      probability: 95
    };
  }

  return { type: 'NONE', score: 0, justification: ['No digit pattern found'], probability: 0 };
};
