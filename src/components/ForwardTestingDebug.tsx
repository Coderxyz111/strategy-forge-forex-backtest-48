
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ServerForwardTestingService } from '@/services/serverForwardTestingService';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';

const ForwardTestingDebug: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check active sessions
      const sessions = await ServerForwardTestingService.getActiveSessions();
      
      // Check trading logs
      const logs = await ServerForwardTestingService.getTradingLogs();
      
      // Check server status
      const serverStatus = await ServerForwardTestingService.checkServerStatus();
      
      setDebugInfo({
        sessions,
        logs: logs.slice(0, 10), // Last 10 logs
        serverStatus,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Diagnostics Complete",
        description: `Found ${sessions.length} active sessions, ${logs.length} total logs`,
      });
    } catch (error) {
      console.error('Diagnostics failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  if (!debugInfo) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Forward Testing Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Forward Testing Status
            </CardTitle>
            <Button size="sm" onClick={runDiagnostics} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Server Status */}
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
            <span className="text-slate-300">Server Status</span>
            <div className="flex items-center gap-2">
              {debugInfo.serverStatus.isRunning ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <Badge className="bg-green-500/10 text-green-400">
                    {debugInfo.serverStatus.sessionsCount} Active
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <Badge variant="destructive">Inactive</Badge>
                </>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="space-y-2">
            <h4 className="text-white font-medium">Active Trading Sessions ({debugInfo.sessions.length})</h4>
            {debugInfo.sessions.length === 0 ? (
              <p className="text-slate-400 text-sm">No active sessions found</p>
            ) : (
              debugInfo.sessions.map((session: any) => (
                <div key={session.id} className="p-3 bg-slate-700 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{session.strategy_name}</p>
                      <p className="text-slate-400 text-sm">{session.symbol} | {session.timeframe}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-400 mb-1">
                        {session.environment}
                      </Badge>
                      <p className="text-slate-400 text-xs">
                        Last: {new Date(session.last_execution).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Trading Logs */}
          <div className="space-y-2">
            <h4 className="text-white font-medium">Recent Trading Logs ({debugInfo.logs.length})</h4>
            {debugInfo.logs.length === 0 ? (
              <p className="text-slate-400 text-sm">No trading logs found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {debugInfo.logs.map((log: any) => (
                  <div key={log.id} className="p-2 bg-slate-700 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{log.log_type}</span>
                      <span className="text-slate-400 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{log.message}</p>
                    {log.trade_data && (
                      <pre className="text-xs text-slate-500 mt-1 overflow-hidden">
                        {JSON.stringify(log.trade_data, null, 2).slice(0, 200)}...
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Troubleshooting Tips */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <h4 className="text-blue-300 font-medium mb-2">Troubleshooting Tips:</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Ensure OANDA connection is active and credentials are valid</li>
              <li>• Verify your strategy generates BUY/SELL signals in backtesting</li>
              <li>• Check that your strategy code doesn't have syntax errors</li>
              <li>• Make sure forward testing session was started successfully</li>
              <li>• Confirm market is open for your trading symbol</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForwardTestingDebug;
