
import { supabase } from '@/integrations/supabase/client';

interface ForwardTestingSession {
  id: string;
  user_id: string;
  strategy_id: string;
  strategy_name: string;
  strategy_code: string;
  symbol: string;
  timeframe: string;
  oanda_account_id: string;
  oanda_api_key: string;
  environment: 'practice' | 'live';
  is_active: boolean;
  last_execution: string;
}

interface TradeData {
  success?: boolean;
  [key: string]: any;
}

export class ForwardTestingService {
  static async startSession(
    userId: string,
    strategyId: string,
    strategyName: string,
    strategyCode: string,
    symbol: string,
    timeframe: string,
    oandaAccountId: string,
    oandaApiKey: string,
    environment: 'practice' | 'live'
  ): Promise<ForwardTestingSession> {
    try {
      const sessionData = {
        user_id: userId,
        strategy_id: strategyId,
        strategy_name: strategyName,
        strategy_code: strategyCode,
        symbol: symbol,
        timeframe: timeframe,
        oanda_account_id: oandaAccountId,
        oanda_api_key: oandaApiKey,
        environment: environment,
        is_active: true,
        last_execution: new Date().toISOString(),
        risk_per_trade: 2.0,
        stop_loss: 40,
        take_profit: 80,
        max_position_size: 100000,
        reverse_signals: false,
        avoid_low_volume: false
      };

      const { data: session, error } = await supabase
        .from('trading_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create forward testing session:', error);
        throw error;
      }

      console.log('✅ Forward testing session created:', session);
      return session as ForwardTestingSession;

    } catch (error) {
      console.error('❌ Failed to start forward testing session:', error);
      throw error;
    }
  }

  static async stopSession(userId: string, sessionId?: string): Promise<void> {
    try {
      console.log('⏹️ Stopping forward testing session for user:', userId);
      
      let query = supabase
        .from('trading_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (sessionId) {
        query = query.eq('id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Failed to stop forward testing session:', error);
        throw error;
      }

      console.log('✅ Forward testing session stopped');

    } catch (error) {
      console.error('❌ Failed to stop forward testing session:', error);
      throw error;
    }
  }

  static async getActiveSessions(userId: string): Promise<ForwardTestingSession[]> {
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get active sessions:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} active forward testing sessions`);
      return (data || []) as ForwardTestingSession[];
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  static async updateSessionExecution(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trading_sessions')
        .update({ last_execution: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('❌ Failed to update session execution time:', error);
      }
    } catch (error) {
      console.error('❌ Failed to update session execution time:', error);
    }
  }

  static async getForwardTestingStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: sessions, error: sessionsError } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('❌ Failed to get trading stats:', sessionsError);
        return null;
      }

      const { data: logs, error: logsError } = await supabase
        .from('trading_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_type', 'trade')
        .order('timestamp', { ascending: false });

      if (logsError) {
        console.error('❌ Failed to get trading logs:', logsError);
        return null;
      }

      // Safely handle trade_data which could be Json (string, number, boolean, object, null)
      const successfulTrades = logs?.filter(log => {
        const tradeData = log.trade_data as TradeData | null;
        return tradeData && typeof tradeData === 'object' && tradeData.success === true;
      }).length || 0;

      const failedTrades = logs?.filter(log => {
        const tradeData = log.trade_data as TradeData | null;
        return tradeData && typeof tradeData === 'object' && tradeData.success === false;
      }).length || 0;

      return {
        totalTrades: logs?.length || 0,
        successfulTrades,
        failedTrades,
        lastExecution: sessions?.[0]?.last_execution || null
      };
    } catch (error) {
      console.error('❌ Failed to get forward testing stats:', error);
      return null;
    }
  }
}
