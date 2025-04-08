"use client"

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';

interface TokenBalanceCheckerProps {
  apiKey?: string;
}

interface BalanceData {
  total_granted: number;
  total_used: number;
  total_available: number;
  limited_access?: boolean;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export default function TokenBalanceChecker({ apiKey: initialApiKey }: TokenBalanceCheckerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [balance, setBalance] = useState<null | BalanceData>(null);
  const { toast } = useToast();

  const checkBalance = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an OpenAI API key',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/check-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check balance');
      }

      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error checking balance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div>
      <div className="mb-4 space-y-2">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-200">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="flex-1"
          />
          <Button 
            onClick={checkBalance} 
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Balance
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          Your API key is only sent to OpenAI and is not stored on our servers.
        </p>
      </div>

      {balance && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          {balance.limited_access ? (
            <div className="text-center">
              <p className="text-white mb-2">API Key Valid</p>
              <p className="text-xs text-gray-400">
                This appears to be a valid API key, but billing information is not accessible.
                This may be a free tier account or a key with limited permissions.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Limit</p>
                  <p className="text-white font-semibold">${balance.total_granted.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Used This Month</p>
                  <p className="text-white font-semibold">${balance.total_used.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Available</p>
                  <p className="text-white font-semibold">${balance.total_available.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (balance.total_used / (balance.total_granted || 1)) * 100)}%` }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-400 mb-4 text-center">
                {((balance.total_used / (balance.total_granted || 1)) * 100).toFixed(1)}% of your monthly limit used
              </p>
              
              {balance.token_usage && (
                <div className="border-t border-gray-700 pt-4 mt-2">
                  <p className="text-sm text-gray-300 mb-3 text-center">Token Usage This Month</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-gray-400 text-xs">Input Tokens</p>
                      <p className="text-white text-sm">{formatNumber(balance.token_usage.input_tokens)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Output Tokens</p>
                      <p className="text-white text-sm">{formatNumber(balance.token_usage.output_tokens)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total Tokens</p>
                      <p className="text-white text-sm">{formatNumber(balance.token_usage.total_tokens)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-4 text-center italic">
                Note: This is an estimate based on your current month&apos;s usage. For precise balance information, 
                please check the OpenAI dashboard.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}