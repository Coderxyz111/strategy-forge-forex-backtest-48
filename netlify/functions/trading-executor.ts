import { schedule } from '@netlify/functions';

// Main trading execution function that runs every 5 minutes
const handler = schedule('*/5 * * * *', async (event, context) => {
  console.log('🚀 Starting scheduled trading execution at:', new Date().toISOString());
  
  try {
    // Check market hours first
    const marketStatus = getMarketStatus();
    console.log('📊 Market Status:', formatMarketStatus(marketStatus));
    
    if (!marketStatus.isOpen) {
      console.log('🕒 Markets are closed, skipping execution');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Markets closed - execution skipped',
          marketStatus: formatMarketStatus(marketStatus),
          nextExecution: marketStatus.nextOpen?.toISOString()
        })
      };
    }
    
    // Get all active trading sessions from database
    const activeSessions = await getActiveTradingSessions();
    
    if (activeSessions.length === 0) {
      console.log('📊 No active trading sessions found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active sessions' })
      };
    }

    console.log(`🎯 Processing ${activeSessions.length} active trading sessions`);
    
    // Process each active session with market hours consideration
    const results = await Promise.allSettled(
      activeSessions.map(session => processTradinSession(session, marketStatus))
    );
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Session ${index + 1} processed successfully:`, result.value);
      } else {
        console.error(`❌ Session ${index + 1} failed:`, result.reason);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Trading execution completed',
        processedSessions: activeSessions.length,
        marketStatus: formatMarketStatus(marketStatus),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('💥 Critical error in trading executor:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Trading execution failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
});

// Get active trading sessions from database
async function getActiveTradingSessions() {
  // This would connect to your Supabase database
  // For now, returning mock data structure
  return [
    {
      id: 'session-1',
      user_id: 'user-123',
      strategy_code: 'strategy_logic(data)',
      symbol: 'EUR_USD',
      timeframe: '5M',
      oanda_account_id: 'account-id',
      oanda_api_key: 'api-key',
      environment: 'practice',
      risk_per_trade: 2.0,
      stop_loss: 40,
      take_profit: 80,
      reverse_signals: false,
      avoid_low_volume: false
    }
  ];
}

// Process individual trading session
async function processTradinSession(session, marketStatus) {
  console.log(`🔄 Processing session for ${session.symbol} - ${session.timeframe}`);
  
  try {
    // Check if we should trade based on market conditions
    if (!shouldExecuteTrade(marketStatus, session)) {
      console.log(`⏸️ Skipping trade for ${session.symbol} due to market conditions`);
      return {
        sessionId: session.id,
        symbol: session.symbol,
        action: 'SKIPPED_MARKET_CONDITIONS',
        reason: formatMarketStatus(marketStatus),
        timestamp: new Date().toISOString()
      };
    }
    
    // 1. Fetch latest market data from OANDA
    const marketData = await fetchOANDAMarketData(session);
    
    // 2. Execute strategy logic
    const signals = await executeStrategyLogic(session.strategy_code, marketData, session.reverse_signals);
    
    // 3. Check for trading signals
    if (signals.entry && signals.entry.length > 0) {
      const latestSignal = signals.entry[signals.entry.length - 1];
      const direction = signals.direction?.[signals.direction.length - 1];
      
      if (latestSignal && direction) {
        console.log(`📈 Trading signal detected: ${direction} for ${session.symbol}`);
        
        // 4. Execute trade via OANDA API
        const tradeResult = await executeOANDATrade(session, direction);
        
        // 5. Log trading activity
        await logTradingActivity(session, {
          signal: latestSignal,
          direction,
          tradeResult,
          marketStatus: formatMarketStatus(marketStatus),
          timestamp: new Date().toISOString()
        });
        
        return {
          sessionId: session.id,
          symbol: session.symbol,
          action: 'TRADE_EXECUTED',
          direction,
          tradeResult,
          marketStatus: formatMarketStatus(marketStatus)
        };
      }
    }
    
    console.log(`📊 No trading signals for ${session.symbol}`);
    return {
      sessionId: session.id,
      symbol: session.symbol,
      action: 'NO_SIGNAL',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error processing session ${session.id}:`, error);
    throw error;
  }
}

// Fetch market data from OANDA
async function fetchOANDAMarketData(session) {
  const baseUrl = session.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com';
    
  const response = await fetch(
    `${baseUrl}/v3/instruments/${session.symbol}/candles?count=500&granularity=${session.timeframe}`,
    {
      headers: {
        'Authorization': `Bearer ${session.oanda_api_key}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`OANDA API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Convert OANDA candle data to strategy-compatible format
  return {
    open: data.candles.map(c => parseFloat(c.mid.o)),
    high: data.candles.map(c => parseFloat(c.mid.h)),
    low: data.candles.map(c => parseFloat(c.mid.l)),
    close: data.candles.map(c => parseFloat(c.mid.c)),
    volume: data.candles.map(c => parseInt(c.volume) || 1000) // Mock volume for forex
  };
}

// Execute strategy logic server-side
async function executeStrategyLogic(strategyCode, marketData, reverseSignals = false) {
  // This is a simplified server-side strategy execution
  // In production, you'd want to use a proper Python executor or convert strategies to JavaScript
  
  // For now, implementing a basic momentum strategy
  const close = marketData.close;
  const entry = [];
  const exit = [];
  const direction = [];
  
  // Simple EMA crossover strategy
  const ema21 = calculateEMA(close, 21);
  const ema55 = calculateEMA(close, 55);
  
  for (let i = 0; i < close.length; i++) {
    if (i < 55) {
      entry.push(false);
      exit.push(false);
      direction.push(null);
    } else {
      const bullish = ema21[i] > ema55[i] && ema21[i-1] <= ema55[i-1];
      const bearish = ema21[i] < ema55[i] && ema21[i-1] >= ema55[i-1];
      
      if (reverseSignals) {
        if (bearish) {
          entry.push(true);
          direction.push('BUY');
        } else if (bullish) {
          entry.push(true);
          direction.push('SELL');
        } else {
          entry.push(false);
          direction.push(null);
        }
      } else {
        if (bullish) {
          entry.push(true);
          direction.push('BUY');
        } else if (bearish) {
          entry.push(true);
          direction.push('SELL');
        } else {
          entry.push(false);
          direction.push(null);
        }
      }
      
      exit.push(false); // Simple strategy - no exit signals for now
    }
  }
  
  return { entry, exit, direction };
}

// Calculate EMA
function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  ema[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

// Execute trade via OANDA API
async function executeOANDATrade(session, direction) {
  const baseUrl = session.environment === 'practice' 
    ? 'https://api-fxpractice.oanda.com'
    : 'https://api-fxtrade.oanda.com';
  
  // Calculate position size based on risk management
  const units = direction === 'BUY' ? 1000 : -1000; // Simplified position sizing
  
  const orderData = {
    order: {
      type: 'MARKET',
      instrument: session.symbol,
      units: units.toString(),
      stopLossOnFill: {
        distance: (session.stop_loss / 10000).toString() // Convert pips to price distance
      },
      takeProfitOnFill: {
        distance: (session.take_profit / 10000).toString()
      }
    }
  };
  
  const response = await fetch(
    `${baseUrl}/v3/accounts/${session.oanda_account_id}/orders`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.oanda_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Trade execution failed: ${error}`);
  }
  
  return await response.json();
}

// Log trading activity
async function logTradingActivity(session, activity) {
  console.log('📝 Logging trading activity:', {
    sessionId: session.id,
    symbol: session.symbol,
    activity
  });
  
  // This would save to your Supabase database
  // For now, just console logging
}

// Market hours utility functions (simplified for server-side)
function getMarketStatus() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const hourUTC = now.getUTCHours();
  
  // Simple forex market hours check (Sunday 22:00 UTC to Friday 22:00 UTC)
  const isWeekend = dayOfWeek === 6 || (dayOfWeek === 0 && hourUTC < 22);
  const isFridayClose = dayOfWeek === 5 && hourUTC >= 22;
  
  const isOpen = !isWeekend && !isFridayClose;
  
  return {
    isOpen,
    activeSessions: isOpen ? ['Global'] : [],
    volume: getVolumeLevel(hourUTC)
  };
}

function getVolumeLevel(hourUTC: number): 'low' | 'medium' | 'high' {
  // London-NY overlap (12:00-17:00 UTC) = high volume
  if (hourUTC >= 12 && hourUTC < 17) return 'high';
  
  // Tokyo-London overlap (7:00-9:00 UTC) = high volume  
  if (hourUTC >= 7 && hourUTC < 9) return 'high';
  
  // Major session hours = medium volume
  if ((hourUTC >= 8 && hourUTC < 17) || (hourUTC >= 0 && hourUTC < 9)) return 'medium';
  
  return 'low';
}

function shouldExecuteTrade(marketStatus, session) {
  if (!marketStatus.isOpen) return false;
  
  // Avoid trading during very low volume periods
  if (marketStatus.volume === 'low' && session.avoid_low_volume) {
    return false;
  }
  
  return true;
}

function formatMarketStatus(status) {
  if (!status.isOpen) {
    return 'Markets Closed';
  }
  return `Markets Open (${status.volume} volume)`;
}

export { handler };
