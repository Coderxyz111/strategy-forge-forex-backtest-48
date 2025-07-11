
export interface BacktestStrategy {
  name: string;
  symbol: string;
  timeframe: string;
  code: string;
  initialBalance: number;
  riskPerTrade: number;
  stopLoss: number;
  takeProfit: number;
  spread: number;
  commission: number;
  slippage: number;
  maxPositionSize: number;
  riskModel: string;
  reverseSignals?: boolean;
  positionSizingMode?: string; // 'manual' or 'ratio'
  riskRewardRatio?: number; // For ratio mode
}

export interface BacktestResults {
  strategy: string;
  symbol: string;
  timeframe: string;
  period: string;
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  profitFactor: number;
  maxDrawdown: number;
  executionMethod?: string;
  enhancedFeatures?: {
    dynamicSpreads: boolean;
    realisticSlippage: boolean;
    advancedPositionSizing: boolean;
    marketImpact: boolean;
  };
  metadata?: any;
  reverse_signals_applied?: boolean;
}

export interface TimeframeInfo {
  value: string;
  label: string;
  period: string;
  dataPoints: number;
  minutesPerBar: number;
}
