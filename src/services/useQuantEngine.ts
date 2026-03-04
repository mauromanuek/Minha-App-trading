import { useState, useEffect, useCallback, useRef } from 'react';
import { derivService } from './derivService';
import { QuantEngine, QuantEngineConfig } from './quant/mainEngine';
import { Candle, MarketRegime } from './quant/marketClassifier';
import { TrendSignal } from './quant/strategyTrend';
import { DigitsSignal } from './quant/strategyDigits';

export const useQuantEngine = (symbol: string, config: QuantEngineConfig) => {
  const engineRef = useRef<QuantEngine>(new QuantEngine(config));
  const [m15Candles, setM15Candles] = useState<Candle[]>([]);
  const [m5Candles, setM5Candles] = useState<Candle[]>([]);
  const [ticks, setTicks] = useState<number[]>([]);
  
  const [quantState, setQuantState] = useState<{
    signal: TrendSignal | DigitsSignal | null;
    regime: MarketRegime;
    reason: string;
  }>({
    signal: null,
    regime: 'UNKNOWN',
    reason: 'Initializing...'
  });

  // Handle incoming messages for candles
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.msg_type === 'history' && data.echo_req.style === 'candles') {
        const candles: Candle[] = data.candles.map((c: any) => ({
          epoch: c.epoch,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));
        
        if (data.echo_req.granularity === 900) {
          setM15Candles(candles);
        } else if (data.echo_req.granularity === 300) {
          setM5Candles(candles);
        }
      } else if (data.msg_type === 'ohlc') {
        const ohlc = data.ohlc;
        const candle: Candle = {
          epoch: ohlc.open_time,
          open: parseFloat(ohlc.open),
          high: parseFloat(ohlc.high),
          low: parseFloat(ohlc.low),
          close: parseFloat(ohlc.close)
        };

        if (ohlc.granularity === 900) {
          setM15Candles(prev => {
            const newCandles = [...prev];
            if (newCandles.length > 0 && newCandles[newCandles.length - 1].epoch === candle.epoch) {
              newCandles[newCandles.length - 1] = candle;
            } else {
              newCandles.push(candle);
              if (newCandles.length > 200) newCandles.shift();
            }
            return newCandles;
          });
        } else if (ohlc.granularity === 300) {
          setM5Candles(prev => {
            const newCandles = [...prev];
            if (newCandles.length > 0 && newCandles[newCandles.length - 1].epoch === candle.epoch) {
              newCandles[newCandles.length - 1] = candle;
            } else {
              newCandles.push(candle);
              if (newCandles.length > 200) newCandles.shift();
            }
            return newCandles;
          });
        }
      } else if (data.msg_type === 'tick' && data.tick) {
        setTicks(prev => {
          const newTicks = [...prev, data.tick.quote].slice(-1000);
          return newTicks;
        });
      }
    };

    derivService.onMessage(handleMessage);

    // Subscribe to M5 and M15 candles
    derivService.subscribeCandles(symbol, 300); // M5
    setTimeout(() => {
      derivService.subscribeCandles(symbol, 900); // M15
    }, 1000); // Stagger requests slightly

    return () => {
      derivService.unsubscribeCandles();
    };
  }, [symbol]);

  // Evaluate engine on data update
  useEffect(() => {
    if (m15Candles.length > 0 && m5Candles.length > 0) {
      engineRef.current.updateData(m15Candles, m5Candles, ticks);
      const result = engineRef.current.evaluate();
      setQuantState(result);
    }
  }, [m15Candles, m5Candles, ticks]);

  // Update config if it changes
  useEffect(() => {
    // Re-initialize engine with new config if needed
    // For simplicity, we just update the balance here
    engineRef.current.updateBalance(config.initialBalance);
  }, [config.initialBalance]);

  return {
    quantState,
    engine: engineRef.current
  };
};
