'use client';

import {
  LoginLink,
  RegisterLink,
} from '@kinde-oss/kinde-auth-nextjs/components';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Component that uses search params
function AuthContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  return (
    <div className='bg-white p-8 rounded-lg shadow-md w-96'>
      <h1 className='text-2xl font-bold mb-6 text-center'>
        {action === 'register' ? 'Create an Account' : 'Sign In'}
      </h1>
      {action === 'register' ? (
        <RegisterLink className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 block text-center'>
          Sign Up with Kinde
        </RegisterLink>
      ) : (
        <LoginLink className='w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300 block text-center'>
          Sign In with Kinde
        </LoginLink>
      )}
      <p className='mt-4 text-center text-sm text-gray-600'>
        {action === 'register' ? (
          <>
            Already have an account?{' '}
            <LoginLink className='text-blue-600 hover:underline'>
              Sign In
            </LoginLink>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <RegisterLink className='text-blue-600 hover:underline'>
              Sign Up
            </RegisterLink>
          </>
        )}
      </p>
    </div>
  );
}

// Loading state for Suspense
function AuthLoading() {
  return (
    <div className='bg-white p-8 rounded-lg shadow-md w-96 flex items-center justify-center'>
      <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600'></div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <Suspense fallback={<AuthLoading />}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
