'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '../_trpc/client';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/src/app/components/ui/button';
import { toast } from '@/src/hooks/use-toast';

// Define the response type to include the accountMerged property
type AuthCallbackResponse = {
  success: boolean;
  accountMerged?: boolean;
  error?: string;
};

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data, isLoading } = trpc.authCallback.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
  });

  useEffect(() => {
    if (!isLoading && data) {
      // Cast the data to our extended type
      const response = data as AuthCallbackResponse;

      if (response.success) {
        // Check if accounts were merged
        if (response.accountMerged) {
          // Show merge success or fail message
          if (response.error) {
            setMessage(`Account merge attempted but had issues: ${response.error}`);
            console.error('Account merge issue:', response.error);

            toast({
              title: 'Account Merge Issue',
              description:
                "Your accounts were identified but couldn't be fully merged. You can still continue.",
              variant: 'destructive',
            });
          } else {
            setMessage('Your accounts have been merged successfully.');

            toast({
              title: 'Accounts Merged',
              description: 'Your accounts have been merged successfully.',
            });
          }

          // Redirect after a short delay to allow user to see the message
          setTimeout(() => {
            router.push(origin ? `/${origin}` : '/dashboard');
          }, 2000);
        } else {
          // Normal success case, just redirect
          router.push(origin ? `/${origin}` : '/dashboard');
        }
      }
    }
  }, [data, isLoading, origin, router]);

  // Error handling with useEffect
  const trpcQuery = trpc.authCallback.useQuery(undefined, {
    retry: false,
    enabled: false,
  });

  useEffect(() => {
    trpcQuery.refetch().catch(err => {
      console.error('Authentication error:', err);
      setError(err.message || 'An error occurred during authentication');

      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/sign-in');
      } else if (err.message?.includes('Unique constraint failed')) {
        // Handle duplicate email errors
        setTimeout(() => {
          router.push(origin ? `/${origin}` : '/dashboard');
        }, 1500);
      }
    });
  }, [origin, router, trpcQuery]);

  if (message) {
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <h3 className="font-semibold text-xl text-green-500">{message}</h3>
          <p>Redirecting you to the dashboard...</p>
          <Loader2 className="h-8 w-8 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  if (error) {
    // If the error is about duplicate emails, show a message but still continue
    if (error.includes('Unique constraint failed')) {
      return (
        <div className="w-full mt-24 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
            <h3 className="font-semibold text-xl">Account already exists</h3>
            <p>Redirecting you to the dashboard...</p>
          </div>
        </div>
      );
    }

    // For other errors, show an error message with retry option
    return (
      <div className="w-full mt-24 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <h3 className="font-semibold text-xl text-red-500">Authentication Error</h3>
          <p>{error}</p>
          <Button onClick={() => router.push('/sign-in')} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
        <h3 className="font-semibold text-xl">Setting up your account...</h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  );
};

export default Page;
