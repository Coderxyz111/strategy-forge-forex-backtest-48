import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Download, Share2, Camera, BarChart3, RefreshCw, Target } from 'lucide-react';
import PerformanceMetrics from './backtest/PerformanceMetrics';
import StatisticsCards from './backtest/StatisticsCards';
import EquityCurveChart from './backtest/EquityCurveChart';
import MonthlyReturnsChart from './backtest/MonthlyReturnsChart';
import TradeLogTable from './backtest/TradeLogTable';
import StrategyInfo from './backtest/StrategyInfo';
import StrategyCoach from './backtest/StrategyCoach';

interface BacktestResultsProps {
  results: any;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  const [showAllTrades, setShowAllTrades] = useState(false);

  if (!results) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Backtest Results</h3>
          <p className="text-slate-400">
            Run a backtest from the Strategy Builder to see detailed performance results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleExportPDF = () => {
    alert('PDF export feature is coming soon!');
  };

  const handleShareResults = () => {
    alert('Share results feature is coming soon!');
  };

  const handleScreenshot = () => {
    alert('Screenshot feature is coming soon!');
  };

  const handleReoptimize = () => {
    console.log('Reoptimize strategy functionality');
  };

  const handleRunNewSymbol = () => {
    console.log('Run on new symbol functionality');
  };

  const handleGenerateReverse = () => {
    console.log('Generate reverse strategy functionality');
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Actions */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Backtest Performance Report</CardTitle>
                <p className="text-slate-300">Strategy: {results.strategy}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareResults}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleScreenshot}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Screenshot
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Key Performance Cards - Larger and More Prominent */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700 hover:scale-105 transition-transform duration-200 hover:shadow-xl hover:shadow-emerald-500/10">
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${results.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {results.totalReturn > 0 ? '+' : ''}{results.totalReturn.toFixed(2)}%
            </div>
            <p className="text-slate-400 text-sm">Total Return</p>
            <div className="mt-2">
              <Badge 
                variant={results.totalReturn > 0 ? 'default' : 'destructive'}
                className={`text-xs ${results.totalReturn > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
              >
                {results.totalReturn > 10 ? 'Excellent' : results.totalReturn > 0 ? 'Profitable' : 'Loss'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 hover:scale-105 transition-transform duration-200 hover:shadow-xl hover:shadow-blue-500/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {results.winRate.toFixed(1)}%
            </div>
            <p className="text-slate-400 text-sm">Win Rate</p>
            <div className="mt-2">
              <Badge 
                variant="secondary"
                className={`text-xs ${
                  results.winRate > 60 ? 'bg-emerald-500/10 text-emerald-400' :
                  results.winRate > 50 ? 'bg-blue-500/10 text-blue-400' :
                  'bg-red-500/10 text-red-400'
                }`}
              >
                {results.winRate > 60 ? 'Strong' : results.winRate > 50 ? 'Good' : 'Weak'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 hover:scale-105 transition-transform duration-200 hover:shadow-xl hover:shadow-orange-500/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {results.maxDrawdown.toFixed(2)}%
            </div>
            <p className="text-slate-400 text-sm">Max Drawdown</p>
            <div className="mt-2">
              <Badge 
                variant="secondary"
                className={`text-xs ${
                  results.maxDrawdown < 10 ? 'bg-emerald-500/10 text-emerald-400' :
                  results.maxDrawdown < 20 ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}
              >
                {results.maxDrawdown < 10 ? 'Low Risk' : results.maxDrawdown < 20 ? 'Moderate' : 'High Risk'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 hover:scale-105 transition-transform duration-200 hover:shadow-xl hover:shadow-purple-500/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {results.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-slate-400 text-sm">Sharpe Ratio</p>
            <div className="mt-2">
              <Badge 
                variant="secondary"
                className={`text-xs ${
                  results.sharpeRatio > 1 ? 'bg-emerald-500/10 text-emerald-400' :
                  results.sharpeRatio > 0.5 ? 'bg-blue-500/10 text-blue-400' :
                  'bg-red-500/10 text-red-400'
                }`}
              >
                {results.sharpeRatio > 1 ? 'Excellent' : results.sharpeRatio > 0.5 ? 'Good' : 'Poor'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Info and Detailed Stats Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <StrategyInfo results={results} />
        </div>
        <div className="xl:col-span-2">
          <StatisticsCards results={results} />
        </div>
      </div>

      {/* Full Width Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EquityCurveChart equityCurve={results.equityCurve} />
        <MonthlyReturnsChart monthlyReturns={results.monthlyReturns} />
      </div>

      {/* Enhanced Trade Log with Collapse */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trade History ({results.trades?.length || 0} trades)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllTrades(!showAllTrades)}
              className="border-slate-600 text-slate-300"
            >
              {showAllTrades ? 'Show Less' : `Show All ${results.trades?.length || 0} Trades`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TradeLogTable 
            trades={showAllTrades ? (results.trades || []) : (results.trades || []).slice(0, 10)} 
            strategyName={results.strategy?.name}
          />
        </CardContent>
      </Card>

      {/* Enhanced Strategy Coach with Action Buttons */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Performance Advisor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleReoptimize}
                className="bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reoptimize Strategy
              </Button>
              <Button
                onClick={handleRunNewSymbol}
                variant="outline"
                className="border-slate-600 text-slate-300"
                size="sm"
              >
                🧪 Run on New Symbol
              </Button>
              <Button
                onClick={handleGenerateReverse}
                variant="outline"
                className="border-slate-600 text-slate-300"
                size="sm"
              >
                🔁 Generate Reverse Strategy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StrategyCoach results={results} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
