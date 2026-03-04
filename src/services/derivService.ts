import { Tick, DerivConfig } from '../types';

class DerivService {
  private socket: WebSocket | null = null;
  private appId: string = '121512';
  private onTickCallback: ((tick: Tick) => void) | null = null;
  private onMessageCallback: ((data: any) => void) | null = null;

  constructor() {
    // Default App ID provided by user
  }

  connect(appId?: string) {
    if (appId) this.appId = appId;
    
    const endpoint = `wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`;
    this.socket = new WebSocket(endpoint);

    this.socket.onopen = () => {
      console.log('Connected to Deriv');
      this.subscribeTicks('R_100'); // Default to Volatility 100
    };

    this.socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      
      if (data.msg_type === 'tick' && data.tick) {
        if (this.onTickCallback) {
          this.onTickCallback(data.tick);
        }
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from Deriv');
      // Attempt reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  authorize(token: string) {
    this.send({ authorize: token });
  }

  sellContract(contractId: number) {
    this.send({
      sell: contractId,
      price: 0 // Sell at market price
    });
  }

  subscribeDigitStats(symbol: string) {
    this.send({
      ticks_history: symbol,
      count: 100,
      end: 'latest',
      style: 'ticks',
      subscribe: 1
    });
  }

  subscribeCandles(symbol: string, granularity: number) {
    this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 200, // Get enough history for EMA 200
      end: 'latest',
      start: 1,
      style: 'candles',
      granularity: granularity,
      subscribe: 1
    });
  }

  unsubscribeCandles() {
    this.send({ forget_all: 'candles' });
  }

  subscribeTicks(symbol: string) {
    this.send({
      ticks: symbol,
      subscribe: 1
    });
  }

  unsubscribeTicks(symbol: string) {
    this.send({ forget_all: 'ticks' });
  }

  buyContract(symbol: string, amount: number, type: string, barrier?: number) {
    const parameters: any = {
      amount: amount,
      basis: 'stake',
      contract_type: type,
      currency: 'USD',
      duration: type.startsWith('DIGIT') ? 1 : 5,
      duration_unit: 't',
      symbol: symbol,
    };

    if (barrier !== undefined) {
      parameters.barrier = barrier;
    }

    this.send({
      buy: 1,
      price: amount,
      parameters,
      subscribe: 1
    });
  }

  onTick(callback: (tick: Tick) => void) {
    this.onTickCallback = callback;
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  private send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const derivService = new DerivService();
