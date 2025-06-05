
export interface IBPosition {
  symbol: string;
  position: number;
  marketPrice: number;
  marketValue: number;
  averageCost: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBOrderStatus {
  orderId: number;
  status: 'Submitted' | 'Filled' | 'Cancelled' | 'PendingSubmit' | 'PreSubmitted';
  filled: number;
  remaining: number;
  avgFillPrice: number;
  lastFillPrice: number;
}

export interface IBAccountSummary {
  totalCashValue: number;
  netLiquidation: number;
  grossPositionValue: number;
  availableFunds: number;
  buyingPower: number;
  currency: string;
}

export interface IBConfig {
  host: string;
  port: number;
  clientId: number;
  isConnected: boolean;
  paperTrading: boolean;
  defaultOrderSize: number;
  riskPerTrade: number;
  autoTrading: boolean;
}

export interface IBTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP';
  price?: number;
  stopPrice?: number;
  timeInForce: 'DAY' | 'GTC' | 'IOC';
  strategyName: string;
}

export class InteractiveBrokersService {
  private static config: IBConfig = {
    host: 'localhost',
    port: 5000, // Client Portal Gateway default port
    clientId: 1,
    isConnected: false,
    paperTrading: true,
    defaultOrderSize: 10000,
    riskPerTrade: 1.0,
    autoTrading: false
  };

  private static positions: Map<string, IBPosition> = new Map();
  private static orders: Map<number, IBOrderStatus> = new Map();
  private static accountSummary: IBAccountSummary | null = null;
  private static baseUrl: string = '';

  static async connect(config: IBConfig): Promise<boolean> {
    try {
      this.config = { ...config };
      this.baseUrl = `https://${config.host}:${config.port}/v1/api`;
      
      console.log('🔗 Connecting to IB Client Portal Gateway...');
      
      // Test connection by trying to get authentication status
      const response = await fetch(`${this.baseUrl}/iserver/auth/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connected to Interactive Brokers Client Portal', data);
        this.config.isConnected = true;
        
        // Initialize account data
        await this.requestAccountData();
        await this.requestPositions();
        
        return true;
      } else {
        throw new Error(`Connection failed: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ IB Connection failed:', error);
      this.config.isConnected = false;
      throw error;
    }
  }

  static disconnect(): void {
    this.config.isConnected = false;
    this.baseUrl = '';
    console.log('🔌 IB Connection Closed');
  }

  static async placeTrade(trade: IBTrade): Promise<number | null> {
    if (!this.config.isConnected) {
      console.warn('IB not connected');
      return null;
    }

    try {
      const orderId = Date.now();
      
      const order = {
        acctId: this.config.paperTrading ? 'DU123456' : '',
        conid: await this.getContractId(trade.symbol),
        orderType: trade.orderType,
        side: trade.action,
        quantity: trade.quantity,
        price: trade.price,
        tif: trade.timeInForce,
      };

      const response = await fetch(`${this.baseUrl}/iserver/account/${order.acctId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: [order]
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📤 Order sent to IB:', result);
        return orderId;
      } else {
        throw new Error(`Order failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to place IB trade:', error);
      return null;
    }
  }

  static async closePosition(symbol: string): Promise<boolean> {
    const position = this.positions.get(symbol);
    if (!position) {
      console.warn(`No position found for ${symbol}`);
      return false;
    }

    const trade: IBTrade = {
      symbol,
      action: position.position > 0 ? 'SELL' : 'BUY',
      quantity: Math.abs(position.position),
      orderType: 'MKT',
      timeInForce: 'DAY',
      strategyName: 'CLOSE_POSITION'
    };

    const orderId = await this.placeTrade(trade);
    return orderId !== null;
  }

  static processBacktestSignals(
    backtestResults: any,
    symbol: string,
    strategyName: string
  ): IBTrade[] {
    const trades: IBTrade[] = [];
    
    if (!backtestResults?.entry || !backtestResults?.trade_direction) {
      return trades;
    }

    const { entry, trade_direction, exit } = backtestResults;
    
    for (let i = 0; i < entry.length; i++) {
      if (entry[i] && trade_direction[i] && trade_direction[i] !== 'NONE') {
        trades.push({
          symbol,
          action: trade_direction[i] as 'BUY' | 'SELL',
          quantity: this.config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName
        });
      }
      
      if (exit?.[i]) {
        trades.push({
          symbol,
          action: trade_direction[i] === 'BUY' ? 'SELL' : 'BUY',
          quantity: this.config.defaultOrderSize,
          orderType: 'MKT',
          timeInForce: 'DAY',
          strategyName: `${strategyName}_EXIT`
        });
      }
    }
    
    return trades;
  }

  private static async getContractId(symbol: string): Promise<number> {
    try {
      const ibSymbol = this.convertSymbolToIB(symbol);
      const response = await fetch(`${this.baseUrl}/iserver/secdef/search?symbol=${ibSymbol}`);
      
      if (response.ok) {
        const data = await response.json();
        return data[0]?.conid || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get contract ID:', error);
      return 0;
    }
  }

  private static async requestAccountData(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/iserver/accounts`);
      if (response.ok) {
        const accounts = await response.json();
        console.log('📊 Account data received:', accounts);
        
        // Mock account summary for now
        this.accountSummary = {
          totalCashValue: 100000,
          netLiquidation: 100000,
          grossPositionValue: 0,
          availableFunds: 100000,
          buyingPower: 400000,
          currency: 'USD'
        };
      }
    } catch (error) {
      console.error('Failed to get account data:', error);
    }
  }

  private static async requestPositions(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/iserver/account/positions/0`);
      if (response.ok) {
        const positions = await response.json();
        console.log('📈 Positions received:', positions);
        
        // Process positions if any
        this.positions.clear();
        // Mock empty positions for now
      }
    } catch (error) {
      console.error('Failed to get positions:', error);
    }
  }

  private static convertSymbolToIB(symbol: string): string {
    let ibSymbol = symbol;
    
    if (symbol.includes('=X')) {
      ibSymbol = symbol.replace('=X', '');
    }
    
    if (symbol.includes('/')) {
      ibSymbol = symbol.replace('/', '.');
    } else if (symbol.length === 6 && !symbol.includes('.')) {
      ibSymbol = `${symbol.slice(0, 3)}.${symbol.slice(3)}`;
    }

    return ibSymbol;
  }

  static getConfig(): IBConfig {
    return { ...this.config };
  }

  static isConnected(): boolean {
    return this.config.isConnected;
  }

  static getPositions(): IBPosition[] {
    return Array.from(this.positions.values());
  }

  static getOrders(): IBOrderStatus[] {
    return Array.from(this.orders.values());
  }

  static getAccountSummary(): IBAccountSummary | null {
    return this.accountSummary;
  }
}
