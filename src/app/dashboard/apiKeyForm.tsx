'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '@/src/hooks/use-toast';
import { Key, Loader2, Trash2 } from 'lucide-react';

interface ApiKeyFormProps {
  hasExistingKey: boolean;
}

export default function ApiKeyForm({ hasExistingKey }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState(hasExistingKey);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to save API key');
      }

      setHasKey(true);
      setApiKey('');
      toast({
        title: 'Success',
        description: 'Your OpenAI API key has been saved.',
      });
    } catch (error: Error | unknown) {
      toast({
        title: `Error: ${error}`,
        description: 'Failed to save your API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      setHasKey(false);
      toast({
        title: 'Success',
        description: 'Your OpenAI API key has been deleted.',
      });
    } catch (error: Error | unknown) {
      toast({
        title: `Error: ${error}`,
        description: 'Failed to delete your API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasKey ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-500" />
            <span className="text-green-500">API key configured</span>
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-2">Remove API Key</span>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="apiKey" className="text-sm text-gray-400">
              OpenAI API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || !apiKey}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Save API Key
          </Button>
        </form>
      )}

      <p className="text-sm text-gray-400 mt-4">
        Your API key is stored securely and used only for making requests to OpenAI&apos;s services.
        {!hasKey && (
          <a href="/api-guide" className="text-purple-400 hover:text-purple-300 ml-1">
            Learn how to get your API key →
          </a>
        )}
      </p>
    </div>
  );
}
