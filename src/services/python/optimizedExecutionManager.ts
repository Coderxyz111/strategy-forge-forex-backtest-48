
import { PyodideManager } from './pyodideManager';
import { TradeExecutionDebugger } from '../trading/tradeExecutionDebugger';

// Lightweight Python setup without heavy pandas operations
export const LIGHTWEIGHT_PYTHON_SETUP = `
import numpy as np
import math
from typing import Dict, List, Any, Optional, Union

print("🐍 Lightweight Python environment initialized")

# Lightweight technical analysis functions (no pandas dependency)
class TechnicalAnalysis:
    @staticmethod
    def sma(data, period):
        """Simple Moving Average"""
        if len(data) < period:
            return [float('nan')] * len(data)
        
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(float('nan'))
            else:
                avg = sum(data[i-period+1:i+1]) / period
                result.append(avg)
        return result
    
    @staticmethod
    def ema(data, period):
        """Exponential Moving Average"""
        if not data or period <= 0:
            return [float('nan')] * len(data)
        
        multiplier = 2 / (period + 1)
        result = [float('nan')] * len(data)
        
        # Find first non-NaN value as starting point
        start_idx = 0
        while start_idx < len(data) and (math.isnan(data[start_idx]) if isinstance(data[start_idx], float) else False):
            start_idx += 1
        
        if start_idx >= len(data):
            return result
        
        result[start_idx] = data[start_idx]
        
        for i in range(start_idx + 1, len(data)):
            if not (math.isnan(data[i]) if isinstance(data[i], float) else False):
                result[i] = (data[i] * multiplier) + (result[i-1] * (1 - multiplier))
            else:
                result[i] = result[i-1]
        
        return result
    
    @staticmethod
    def rsi(data, period=14):
        """Relative Strength Index"""
        if len(data) < period + 1:
            return [float('nan')] * len(data)
        
        deltas = [data[i] - data[i-1] for i in range(1, len(data))]
        gains = [delta if delta > 0 else 0 for delta in deltas]
        losses = [-delta if delta < 0 else 0 for delta in deltas]
        
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        result = [float('nan')] * (period)
        
        for i in range(period, len(data)):
            if avg_loss == 0:
                result.append(100)
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                result.append(rsi)
            
            if i < len(deltas):
                avg_gain = (avg_gain * (period - 1) + gains[i]) / period
                avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        return result
    
    @staticmethod
    def atr(high, low, close, period=14):
        """Average True Range"""
        if len(high) != len(low) or len(low) != len(close):
            return [float('nan')] * len(close)
        
        true_ranges = []
        for i in range(1, len(close)):
            hl = high[i] - low[i]
            hc = abs(high[i] - close[i-1])
            lc = abs(low[i] - close[i-1])
            true_ranges.append(max(hl, hc, lc))
        
        # Pad with NaN for first value
        tr_with_padding = [float('nan')] + true_ranges
        
        return TechnicalAnalysis.sma(tr_with_padding, period)

def execute_strategy(data):
    """Optimized strategy execution function"""
    try:
        print("🚀 Executing strategy with lightweight setup...")
        print(f"📊 Data type: {type(data)}")
        print(f"📊 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Execute the user's strategy code
        local_vars = {'data': data, 'TechnicalAnalysis': TechnicalAnalysis}
        exec(strategy_code, globals(), local_vars)
        
        print(f"✅ Strategy executed, local vars: {list(local_vars.keys())}")
        
        # Return the result from local variables
        if 'result' in local_vars:
            result = local_vars['result']
            print(f"📊 Found result variable with keys: {list(result.keys()) if isinstance(result, dict) else type(result)}")
            return result
        else:
            # If no result variable, try to construct one from common variables
            entry = local_vars.get('entry', [])
            exit = local_vars.get('exit', [])
            direction = local_vars.get('direction', local_vars.get('trade_direction', []))
            
            print(f"🔍 Constructing result from variables:")
            print(f"   Entry signals: {len(entry) if hasattr(entry, '__len__') else 'Not a list'}")
            print(f"   Exit signals: {len(exit) if hasattr(exit, '__len__') else 'Not a list'}")
            print(f"   Directions: {len(direction) if hasattr(direction, '__len__') else 'Not a list'}")
            
            # Try to find any boolean arrays that might be signals
            if not entry and not exit and not direction:
                for key, value in local_vars.items():
                    if isinstance(value, (list, np.ndarray)) and len(value) > 0:
                        if key.lower() in ['buy_signals', 'sell_signals', 'signals', 'entries']:
                            entry = value
                            print(f"📊 Found signals in variable: {key}")
                            break
                
                # Generate basic signals if none found
                if not entry:
                    print("⚠️ No signals found, generating empty signals")
                    data_length = len(data.get('close', [])) if isinstance(data, dict) else 100
                    entry = [False] * data_length
                    exit = [False] * data_length
                    direction = [None] * data_length
            
            return {
                'entry': entry,
                'exit': exit if exit else [False] * len(entry),
                'direction': direction if direction else [None] * len(entry)
            }
    except Exception as e:
        print(f"❌ Strategy execution error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'entry': [False] * len(data.get('close', [])) if isinstance(data, dict) else [False] * 100,
            'exit': [False] * len(data.get('close', [])) if isinstance(data, dict) else [False] * 100,
            'direction': [None] * len(data.get('close', [])) if isinstance(data, dict) else [None] * 100,
            'error': str(e)
        }

print("🎯 Lightweight strategy execution function defined successfully")
`;

export class OptimizedExecutionManager {
  private static instance: OptimizedExecutionManager;
  private pyodide: any = null;
  private isInitialized = false;

  static getInstance(): OptimizedExecutionManager {
    if (!OptimizedExecutionManager.instance) {
      OptimizedExecutionManager.instance = new OptimizedExecutionManager();
    }
    return OptimizedExecutionManager.instance;
  }

  async initializePyodide(): Promise<void> {
    if (this.pyodide && this.isInitialized) {
      console.log('🐍 Optimized Pyodide already initialized');
      return;
    }

    try {
      console.log('🔧 Loading optimized Pyodide environment...');
      
      // Load Pyodide without heavy packages initially
      if (typeof window !== 'undefined' && !window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(script);
        });
      }

      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        fullStdLib: false
      });

      // CRITICAL FIX: Load packages with proper error handling and retry
      console.log('📦 Loading essential packages with retry logic...');
      let packagesLoaded = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!packagesLoaded && retryCount < maxRetries) {
        try {
          console.log(`📦 Package loading attempt ${retryCount + 1}/${maxRetries}...`);
          await this.pyodide.loadPackage(['numpy']);
          
          // Verify numpy is actually available
          await this.pyodide.runPython(`
import numpy as np
print("✅ Numpy successfully imported and verified")
test_array = np.array([1, 2, 3])
print(f"✅ Numpy test array: {test_array}")
`);
          
          packagesLoaded = true;
          console.log('✅ Essential packages loaded and verified');
          
        } catch (packageError) {
          retryCount++;
          console.warn(`⚠️ Package loading attempt ${retryCount} failed:`, packageError);
          
          if (retryCount >= maxRetries) {
            console.error('❌ Failed to load packages after all retries');
            throw new Error(`Failed to load Python packages after ${maxRetries} attempts: ${packageError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Skip pandas for now to avoid memory issues
      console.log('⚠️ Skipping pandas to conserve memory - using lightweight alternatives');
      
      // Set up lightweight environment
      console.log('🔧 Setting up lightweight Python environment...');
      await this.pyodide.runPython(LIGHTWEIGHT_PYTHON_SETUP);
      
      this.isInitialized = true;
      console.log('✅ Optimized Python environment ready with verified packages');
      
    } catch (error) {
      console.error('❌ Failed to initialize optimized Pyodide:', error);
      this.isInitialized = false;
      this.pyodide = null;
      throw error;
    }
  }

  async executePythonStrategy(strategyCode: string, marketData: any): Promise<any> {
    try {
      // Ensure initialization is complete
      await this.initializePyodide();
      
      if (!this.pyodide) {
        throw new Error('Pyodide not initialized');
      }

      console.log('📊 Setting market data...');
      
      // Enhanced debugging - log market data details
      const dataPoints = marketData.close?.length || 0;
      console.log(`📈 Market data: ${dataPoints} data points`);
      if (dataPoints > 0) {
        console.log(`📊 Latest close: ${marketData.close[dataPoints - 1]}`);
        console.log(`📊 Price range: ${Math.min(...marketData.close)} - ${Math.max(...marketData.close)}`);
      }
      
      // Set market data in Python environment
      this.pyodide.globals.set('open_prices', marketData.open || []);
      this.pyodide.globals.set('high_prices', marketData.high || []);
      this.pyodide.globals.set('low_prices', marketData.low || []);
      this.pyodide.globals.set('close_prices', marketData.close || []);
      this.pyodide.globals.set('volume_data', marketData.volume || []);

      // Set the strategy code
      this.pyodide.globals.set('strategy_code', strategyCode);
      
      // Execute data setup (lightweight version) with package verification
      await this.pyodide.runPython(`
# Verify numpy is available before proceeding
try:
    import numpy as np
    print("✅ Numpy verification passed")
except ImportError as e:
    print(f"❌ Numpy import failed: {e}")
    raise ImportError("Numpy not available - package loading failed")

# Convert data to numpy arrays
open_data = np.array(open_prices) if open_prices else np.array([])
high_data = np.array(high_prices) if high_prices else np.array([])
low_data = np.array(low_prices) if low_prices else np.array([])
close_data = np.array(close_prices) if close_prices else np.array([])
volume_data_array = np.array(volume_data) if volume_data else np.array([])

print(f"📊 Data loaded: {len(close_data)} data points")
if len(close_data) > 0:
    print(f"📈 Latest close price: {close_data[-1]}")

# Create data dictionary (both lowercase and uppercase for compatibility)
data = {
    'open': open_data.tolist(),
    'high': high_data.tolist(),
    'low': low_data.tolist(),
    'close': close_data.tolist(),
    'volume': volume_data_array.tolist(),
    'Open': open_data.tolist(),
    'High': high_data.tolist(),
    'Low': low_data.tolist(),
    'Close': close_data.tolist(),
    'Volume': volume_data_array.tolist()
}
`);

      // Execute the strategy and get result with enhanced debugging
      await this.pyodide.runPython(`
try:
    strategy_result = execute_strategy(data)
    print(f"✅ Strategy execution result type: {type(strategy_result)}")
    if hasattr(strategy_result, 'keys'):
        print(f"📊 Result keys: {list(strategy_result.keys())}")
    
    # Enhanced debugging for entry signals
    if 'entry' in strategy_result:
        entry_signals = strategy_result['entry']
        entry_count = sum(1 for signal in entry_signals if signal) if entry_signals else 0
        print(f"🎯 Entry signals found: {entry_count}")
        
        if entry_count > 0:
            # Find last entry signal
            for i in range(len(entry_signals) - 1, -1, -1):
                if entry_signals[i]:
                    print(f"📍 Last entry signal at index {i}")
                    if 'direction' in strategy_result and i < len(strategy_result['direction']):
                        print(f"📊 Signal direction: {strategy_result['direction'][i]}")
                    break
    
    # Store result in global variable for retrieval
    globals()['final_result'] = strategy_result
    print("📊 Result stored in globals as 'final_result'")
    
except Exception as e:
    print(f"❌ Final execution error: {e}")
    import traceback
    traceback.print_exc()
    globals()['final_result'] = {
        'entry': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'exit': [False] * len(data['close']) if len(data['close']) > 0 else [False] * 100,
        'direction': [None] * len(data['close']) if len(data['close']) > 0 else [None] * 100,
        'error': str(e)
    }
`);

      // Get the result from Python globals
      const pythonResult = this.pyodide.globals.get('final_result');
      console.log('🔍 Retrieved Python result:', {
        resultExists: !!pythonResult,
        resultType: typeof pythonResult,
        hasToJs: pythonResult && typeof pythonResult.toJs === 'function'
      });

      // Handle undefined result (execution failure)
      if (pythonResult === undefined || pythonResult === null) {
        console.error('❌ Python execution returned undefined/null result');
        const dataLength = marketData?.close?.length || 100;
        return {
          entry: Array(dataLength).fill(false),
          exit: Array(dataLength).fill(false),
          direction: Array(dataLength).fill(null),
          error: 'Python execution failed - no result returned'
        };
      }

      // Convert result to JavaScript with proper error handling
      let jsResult;
      try {
        if (pythonResult.toJs) {
          jsResult = pythonResult.toJs({ dict_converter: Object.fromEntries });
        } else {
          // If toJs is not available, try direct conversion
          jsResult = pythonResult;
        }
        console.log('✅ Successfully converted Python result to JavaScript');
      } catch (error) {
        console.error('❌ Error converting Python result to JavaScript:', error);
        const dataLength = marketData?.close?.length || 100;
        return {
          entry: Array(dataLength).fill(false),
          exit: Array(dataLength).fill(false),
          direction: Array(dataLength).fill(null),
          error: 'Failed to convert Python result to JavaScript'
        };
      }

      // Enhanced result analysis and debugging
      const entryCount = jsResult?.entry?.filter?.(Boolean)?.length || 0;
      const buySignals = jsResult?.direction?.filter?.(d => d === 'BUY')?.length || 0;
      const sellSignals = jsResult?.direction?.filter?.(d => d === 'SELL')?.length || 0;
      
      console.log('🎯 Strategy execution completed:', {
        dataPoints: marketData?.close?.length || 0,
        hasEntry: jsResult?.entry?.length > 0,
        entrySignals: entryCount,
        buySignals,
        sellSignals,
        hasDirection: !!jsResult?.direction,
        error: jsResult?.error,
        resultKeys: Object.keys(jsResult || {})
      });

      // Log to trade debugger with enhanced details
      const debugger = TradeExecutionDebugger.getInstance();
      debugger.logStep('PYTHON_EXECUTION_COMPLETE', {
        dataPoints: marketData?.close?.length || 0,
        entrySignalsCount: entryCount,
        buySignalsCount: buySignals,
        sellSignalsCount: sellSignals,
        resultKeys: Object.keys(jsResult || {}),
        hasResult: !!jsResult,
        lastEntrySignal: jsResult?.entry?.[jsResult.entry.length - 1] || false,
        lastDirection: jsResult?.direction?.[jsResult.direction.length - 1] || null,
        error: jsResult?.error || null
      });

      return jsResult;

    } catch (error) {
      console.error('❌ Python execution failed:', error);
      
      // Enhanced error logging
      const debugger = TradeExecutionDebugger.getInstance();
      debugger.logStep('PYTHON_EXECUTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown execution error',
        dataPoints: marketData?.close?.length || 0
      });
      
      // Return a safe fallback result
      const dataLength = marketData?.close?.length || 100;
      return {
        entry: Array(dataLength).fill(false),
        exit: Array(dataLength).fill(false),
        direction: Array(dataLength).fill(null),
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  reset(): void {
    this.pyodide = null;
    this.isInitialized = false;
    console.log('🔄 Optimized execution manager reset');
  }
}
