
import { useEffect, useCallback } from 'react';
import { useOANDAConfig } from '@/hooks/oanda/useOANDAConfig';
import { useOANDAConnection } from '@/hooks/oanda/useOANDAConnection';
import { useOANDAStrategies } from '@/hooks/oanda/useOANDAStrategies';
import { useOANDATrade } from '@/hooks/oanda/useOANDATrade';
import { useOANDAForwardTesting } from '@/hooks/oanda/useOANDAForwardTesting';
import { useOANDAKeepalive } from '@/hooks/oanda/useOANDAKeepalive';
import { useOANDAState } from '@/hooks/oanda/useOANDAState';
import { useOANDALogging } from '@/hooks/oanda/useOANDALogging';
import { AutoStrategyTester } from '@/services/autoTesting/autoStrategyTester';

export const useOANDAIntegration = () => {
  const {
    config,
    savedConfigs,
    isLoading,
    handleConfigChange,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    loadSavedConfigs
  } = useOANDAConfig();

  const {
    connectionStatus,
    connectionError,
    isConnected,
    lastConnectedAt,
    accountInfo,
    handleTestConnection,
    resetConnectionStatus,
    autoReconnect,
    retryCount,
    isAutoReconnecting
  } = useOANDAConnection();

  const {
    savedStrategies,
    selectedStrategy,
    isLoadingStrategies,
    loadSavedStrategies,
    loadStrategyById,
    handleLoadStrategy,
    handleDeleteStrategy
  } = useOANDAStrategies();

  const {
    isTestingTrade,
    handleTestTrade
  } = useOANDATrade();

  const {
    isForwardTestingActive,
    setIsForwardTestingActive,
    handleToggleForwardTesting: baseHandleToggleForwardTesting,
    autoStartForwardTesting
  } = useOANDAForwardTesting();

  const { 
    keepaliveService, 
    isKeepaliveActive, 
    getKeepaliveStatus, 
    forceRestart 
  } = useOANDAKeepalive(config, connectionStatus);

  const {
    isConfigured,
    canStartTesting,
    connectionStatusIcon
  } = useOANDAState(config, selectedStrategy, connectionStatus);

  // Auto-reconnect when config changes and we have valid credentials
  useEffect(() => {
    if (config.accountId && config.apiKey && !isConnected && !isAutoReconnecting) {
      console.log('🔄 Config updated, attempting auto-reconnect...');
      autoReconnect(config);
    }
  }, [config.accountId, config.apiKey, config.environment]);

  // Auto-start forward testing when ready
  useEffect(() => {
    if (isConnected && selectedStrategy && canStartTesting && !isForwardTestingActive) {
      console.log('🎯 Conditions met for auto-start - checking preferences...');
      
      const timer = setTimeout(() => {
        autoStartForwardTesting(config, selectedStrategy, isConnected);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, selectedStrategy, canStartTesting, isForwardTestingActive]);

  // Auto-manage AutoStrategyTester based on forward testing status
  useEffect(() => {
    const autoTester = AutoStrategyTester.getInstance();
    
    if (isConnected && selectedStrategy && config.accountId && isForwardTestingActive) {
      console.log('🚀 Starting AutoStrategyTester with console logging...');
      autoTester.autoStart(config, selectedStrategy, isForwardTestingActive);
    } else if (autoTester.isActive() && !isForwardTestingActive) {
      console.log('⏸️ Stopping AutoStrategyTester - forward testing inactive');
      autoTester.stopAutoTesting();
    }
  }, [isConnected, selectedStrategy, isForwardTestingActive, config]);

  // Log status changes for debugging
  useEffect(() => {
    console.log('🔄 Integration Status Update:');
    console.log('   - Connected:', isConnected);
    console.log('   - Strategy:', selectedStrategy?.strategy_name || 'None');
    console.log('   - Forward Testing:', isForwardTestingActive ? 'ACTIVE' : 'INACTIVE');
    console.log('   - Can Start Testing:', canStartTesting);
    
    if (isForwardTestingActive && selectedStrategy) {
      console.log('✅ All conditions met - console logs should appear every minute');
    }
  }, [isConnected, selectedStrategy?.strategy_name, isForwardTestingActive, canStartTesting]);

  const handleConfigChangeWithAutoReconnect = useCallback((field: keyof typeof config, value: any) => {
    handleConfigChange(field, value);
  }, [handleConfigChange]);

  const handleShowGuide = useCallback(() => {
    console.log('Show OANDA setup guide');
  }, []);

  const handleToggleForwardTesting = useCallback(() => {
    console.log('🔄 Toggling forward testing...');
    const result = baseHandleToggleForwardTesting(config, selectedStrategy, canStartTesting);
    
    // Log the action
    if (isForwardTestingActive) {
      console.log('⏸️ Forward testing will be stopped - console logs will stop');
    } else {
      console.log('🚀 Forward testing will be started - console logs will begin in ~10 seconds');
    }
    
    return result;
  }, [baseHandleToggleForwardTesting, config, selectedStrategy, canStartTesting, isForwardTestingActive]);

  const handleEnhancedTestConnection = useCallback(async () => {
    await handleTestConnection(config);
  }, [handleTestConnection, config]);

  // Use logging hook
  useOANDALogging(
    savedStrategies,
    selectedStrategy,
    config,
    connectionStatus,
    canStartTesting,
    isTestingTrade,
    isForwardTestingActive
  );

  return {
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
    handleConfigChange: handleConfigChangeWithAutoReconnect,
    handleTestConnection: handleEnhancedTestConnection,
    handleSaveConfig,
    handleSaveNewConfig,
    handleLoadConfig,
    handleDeleteConfig,
    handleLoadStrategy,
    handleTestTrade: () => handleTestTrade(config, selectedStrategy, connectionStatus),
    handleDeleteStrategy,
    handleToggleForwardTesting,
    handleShowGuide,
    loadSavedConfigs,
    loadSavedStrategies,
    autoReconnect: () => autoReconnect(config),
    forceRestartKeepalive: forceRestart
  };
};
