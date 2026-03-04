export interface RiskConfig {
  dailyStopLoss: number; // 4%
  dailyTakeProfit: number; // 6%
  maxTradesPerDay: number; // 10
  riskPerTrade: number; // 1%
}

export interface TradeResult {
  profit: number;
  isWin: boolean;
}

export class RiskManager {
  private config: RiskConfig;
  private currentBalance: number;
  private initialBalance: number;
  private tradesToday: number;
  private consecutiveLosses: number;

  constructor(config: RiskConfig, initialBalance: number) {
    this.config = config;
    this.initialBalance = initialBalance;
    this.currentBalance = initialBalance;
    this.tradesToday = 0;
    this.consecutiveLosses = 0;
  }

  public updateBalance(balance: number) {
    this.currentBalance = balance;
  }

  public registerTrade(result: TradeResult) {
    this.tradesToday++;
    if (result.isWin) {
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
    }
  }

  public canTrade(): { allowed: boolean; reason?: string } {
    if (this.tradesToday >= this.config.maxTradesPerDay) {
      return { allowed: false, reason: 'Max trades per day reached' };
    }

    if (this.consecutiveLosses >= 3) {
      return { allowed: false, reason: 'Blocked after 3 consecutive losses' };
    }

    const dailyProfit = ((this.currentBalance - this.initialBalance) / this.initialBalance) * 100;

    if (dailyProfit <= -this.config.dailyStopLoss) {
      return { allowed: false, reason: 'Daily stop loss reached' };
    }

    if (dailyProfit >= this.config.dailyTakeProfit) {
      return { allowed: false, reason: 'Daily take profit reached' };
    }

    return { allowed: true };
  }

  public getStake(): number {
    return this.currentBalance * (this.config.riskPerTrade / 100);
  }
}
