
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BacktestStrategy } from '@/types/backtest';
import { BacktestValidation } from '@/services/backtestValidation';
import { MarketDataService } from '@/services/marketDataService';
import { BacktestExecutionService } from '@/services/backtestExecutionService';

export const useBacktest = () => {
  const [strategy, setStrategy] = useState<BacktestStrategy>({
    name: '',
    code: '',
    symbol: 'EUR_USD',
    timeframe: 'M5',
    initialBalance: 10000,
    riskPerTrade: 2,
    stopLoss: 50,
    takeProfit: 100,
    spread: 1.5,
    commission: 0,
    slippage: 0.5,
    maxPositionSize: 100000,
    riskModel: 'fixed'
  });
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const handleStrategyChange = (updates: Partial<BacktestStrategy>) => {
    setStrategy(prev => ({ ...prev, ...updates }));
  };

  const runBacktest = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Validate strategy parameters
      setCurrentStep('Validating enhanced strategy parameters...');
      BacktestValidation.validateStrategy(strategy);

      // Step 2: Fetch real market data
      setCurrentStep('Fetching real market data from Twelve Data...');
      const { marketData, metadata } = await MarketDataService.fetchMarketData(strategy);

      // Step 3-6: Execute strategy and get results
      const results = await BacktestExecutionService.executeStrategy(
        strategy,
        marketData,
        metadata,
        setCurrentStep
      );

      setBacktestResults(results);

    } catch (error) {
      console.error('Enhanced backtest failed:', error);
      
      let errorMessage = 'An error occurred while running the enhanced backtest';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Enhanced Backtest Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  return {
    strategy,
    backtestResults,
    isRunning,
    currentStep,
    handleStrategyChange,
    runBacktest
  };
};
