import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import BacktestResults from "@/components/BacktestResults";
import PythonStrategyTab from "@/components/strategy/PythonStrategyTab";
import OANDAConfigForm from "@/components/strategy/OANDAConfigForm";
import OANDATradingDashboard from "@/components/strategy/OANDATradingDashboard";
import { useOANDAIntegration } from "@/hooks/useOANDAIntegration";
import { useBacktest } from "@/hooks/useBacktest";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ForwardTestingDebug from '@/components/ForwardTestingDebug';

const Index = () => {
  const [activeTab, setActiveTab] = useState<"strategy" | "oanda" | "trading">("strategy");
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    config,
    savedConfigs,
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    savedStrategies,
    selectedStrategy,
    isLoadingStrategies,
    isLoading,
    isTestingTrade,
    isConfigured,
    canStartTesting,
    isForwardTestingActive,
    connectionStatusIcon,
    retryCount,
    isAutoReconnecting,
    configValidation,
    handleConfigChange,
    handleTestConnection,
    handleManualConnect,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade,
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    loadSavedConfigs,
    loadSavedStrategies,
    autoReconnect,
    forceRestartKeepalive
  } = useOANDAIntegration();

  const {
    strategy,
    backtestResults,
    isRunning,
    handleStrategyChange,
    runBacktest
  } = useBacktest();

  const handleRunBacktest = useCallback(async () => {
    if (!strategy.code.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter strategy code",
        variant: "destructive",
      });
      return;
    }

    if (!strategy.symbol.trim()) {
       toast({
        title: "Symbol Required",
        description: "Please enter trading symbol",
        variant: "destructive",
      });
      return;
    }

    runBacktest();
  }, [strategy, runBacktest, toast]);

  useEffect(() => {
    if (user) {
      loadSavedConfigs();
      loadSavedStrategies();
    }
  }, [user, loadSavedConfigs, loadSavedStrategies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-700 sticky top-0 z-50">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">
            Algorithmic Trading Platform
          </h1>
          <div className="flex items-center space-x-4">
            <Label htmlFor="symbol" className="text-slate-300">
              Symbol:
            </Label>
            <Input
              type="text"
              id="symbol"
              placeholder="e.g., EUR_USD"
              className="bg-slate-800 text-white border-slate-600 focus:ring-blue-500 focus:border-blue-500"
              value={strategy.symbol}
              onChange={(e) => handleStrategyChange({ symbol: e.target.value })}
            />
            <Label htmlFor="timeframe" className="text-slate-300">
              Timeframe:
            </Label>
            <Input
              type="text"
              id="timeframe"
              placeholder="e.g., M5"
              className="bg-slate-800 text-white border-slate-600 focus:ring-blue-500 focus:border-blue-500"
              value={strategy.timeframe}
              onChange={(e) => handleStrategyChange({ timeframe: e.target.value })}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Strategy Builder */}
          <div className="space-y-6">
            <Tabs defaultValue="strategy" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="bg-slate-700">
                <TabsTrigger value="strategy" className="data-[state=active]:bg-slate-600">Strategy</TabsTrigger>
                <TabsTrigger value="oanda" className="data-[state=active]:bg-slate-600">OANDA</TabsTrigger>
                <TabsTrigger value="trading" className="data-[state=active]:bg-slate-600">Trading</TabsTrigger>
              </TabsList>
              <TabsContent value="strategy" className="mt-2">
                <PythonStrategyTab
                  strategy={strategy}
                  onStrategyChange={handleStrategyChange}
                  onRunBacktest={handleRunBacktest}
                  isRunning={isRunning}
                  backtestResults={backtestResults}
                />
              </TabsContent>
              <TabsContent value="oanda" className="mt-2">
                <OANDAConfigForm
                  config={config}
                  savedConfigs={savedConfigs}
                  onConfigChange={handleConfigChange}
                  onTestConnection={handleTestConnection}
                  onManualConnect={handleManualConnect}
                  onSaveConfig={handleSaveConfig}
                  onSaveNewConfig={handleSaveNewConfig}
                  onLoadConfig={handleLoadConfig}
                  onDeleteConfig={handleDeleteConfig}
                  onTestTrade={handleTestTrade}
                  connectionStatus={connectionStatus}
                  connectionError={connectionError}
                  isConnected={isConnected}
                  lastConnectedAt={lastConnectedAt}
                  accountInfo={accountInfo}
                  isLoading={isLoading}
                  isTestingTrade={isTestingTrade}
                  canStartTesting={canStartTesting}
                  isForwardTestingActive={isForwardTestingActive}
                  connectionStatusIcon={connectionStatusIcon}
                  connectionProps={{
                    retryCount,
                    isAutoReconnecting
                  }}
                />
              </TabsContent>
              <TabsContent value="trading" className="mt-2">
                <OANDATradingDashboard
                  isActive={isForwardTestingActive}
                  strategy={selectedStrategy}
                  environment={config.environment}
                  oandaConfig={{
                    accountId: config.accountId || '',
                    apiKey: config.apiKey || '',
                    environment: config.environment,
                  }}
                  onToggleForwardTesting={handleToggleForwardTesting}
                />
              </TabsContent>
            </Tabs>
            <BacktestResults results={backtestResults} />
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Add Forward Testing Debug at the top */}
            {activeTab === 'oanda' && (
              <ForwardTestingDebug />
            )}

            {isConfigured && !isForwardTestingActive && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-md">
                <h3 className="text-lg font-semibold">Ready to Trade Live!</h3>
                <p>
                  Configure your strategy and OANDA connection, then start forward testing to
                  execute real trades.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
