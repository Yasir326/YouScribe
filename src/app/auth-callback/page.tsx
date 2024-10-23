'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/src/app/_trpc/client';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');

  const { data, isLoading, error } = trpc.authCallback.useQuery(undefined, {
    retry: true,
    retryDelay: 500,
  });

  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    if (data?.success) {
      // user is synced to db
      router.push(origin ? `/${origin}` : '/dashboard');
    } else if (error) {
      if (error.data?.code === 'UNAUTHORIZED') {
        router.push('/sign-in');
      } else {
        // Handle other types of errors
        console.error("An error occurred:", error);
        router.push('/error'); // Redirect to an error page
      }
    }
  }, [data, isLoading, error, origin, router]);

  return (
    <div className='w-full mt-2 flex justify-center'>
      <div className='flex flex-col items-center gap-2'>
        <Loader2 className='h-8 w-8 animate-spin text-zinc-800' aria-label="Loading" />
        <h3 className='font-semibold text-xl'>
          {isLoading ? 'Verifying your account...' : 'Creating your account...'}
        </h3>
        <p>You will be redirected shortly</p>
      </div>
    </div>
  );
};

export default Page;
