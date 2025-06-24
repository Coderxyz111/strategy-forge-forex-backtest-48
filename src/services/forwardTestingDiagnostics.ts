
import { supabase } from '@/integrations/supabase/client';

export class ForwardTestingDiagnostics {
  static async checkStrategySignals(strategyCode: string, marketData: any) {
    try {
      console.log('🔍 Checking strategy signals...');
      
      // This would normally execute the strategy
      // For now, let's just validate the structure
      if (!strategyCode.includes('strategy_logic')) {
        return {
          isValid: false,
          error: 'Strategy must contain a strategy_logic function'
        };
      }
      
      if (!strategyCode.includes('BUY') && !strategyCode.includes('SELL')) {
        return {
          isValid: false,
          error: 'Strategy must generate BUY or SELL signals'
        };
      }
      
      return {
        isValid: true,
        message: 'Strategy structure looks valid'
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Strategy validation failed: ${error}`
      };
    }
  }

  static async checkOANDAConnection(config: any) {
    try {
      if (!config.accountId || !config.apiKey) {
        return {
          isValid: false,
          error: 'OANDA credentials missing'
        };
      }
      
      // Test connection via edge function
      const { data, error } = await supabase.functions.invoke('oanda-connection-test', {
        body: {
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        }
      });
      
      if (error) {
        return {
          isValid: false,
          error: `OANDA connection failed: ${error.message}`
        };
      }
      
      return {
        isValid: true,
        message: 'OANDA connection successful',
        data
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Connection test failed: ${error}`
      };
    }
  }

  static async runFullDiagnostics(strategy: any, config: any) {
    console.log('🚀 Running full forward testing diagnostics...');
    
    const results = {
      strategy: await this.checkStrategySignals(strategy?.code || '', {}),
      oanda: await this.checkOANDAConnection(config),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Diagnostics Results:', results);
    
    return results;
  }
}
