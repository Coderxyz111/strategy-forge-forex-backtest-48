
import { OANDAConfig } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function testOANDAConnection(config: OANDAConfig): Promise<any> {
  if (!config.accountId || !config.apiKey) {
    throw new Error('Missing Account ID or API Key');
  }

  console.log('🔍 Testing OANDA connection via server-side function...', {
    accountId: config.accountId,
    environment: config.environment
  });

  // Use Supabase Edge Function to test connection (avoids CORS issues)
  try {
    const { data, error } = await supabase.functions.invoke('oanda-connection-test', {
      body: {
        config: {
          accountId: config.accountId,
          apiKey: config.apiKey,
          environment: config.environment
        }
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw new Error(`Connection test failed: ${error.message}`);
    }

    if (!data.success) {
      console.error('❌ OANDA connection test failed:', data.error);
      throw new Error(data.error || 'Connection test failed');
    }

    console.log('✅ OANDA connection successful via edge function:', data.result);
    return data.result;

  } catch (error) {
    console.error('❌ Connection test error:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key') || error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your OANDA API credentials and ensure the token is active.');
      } else if (error.message.includes('Account not found') || error.message.includes('404')) {
        throw new Error('Account not found. Please verify your Account ID is correct.');
      } else if (error.message.includes('Access forbidden') || error.message.includes('403')) {
        throw new Error('Access forbidden. Please verify your API key has proper permissions.');
      } else if (error.message.includes('Network') || error.message.includes('timeout')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    
    throw error;
  }
}
