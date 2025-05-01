import { AppRouter } from '@/src/trpc';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: process.env.NODE_ENV === 'production'
        ? 'https://www.youlearnnow.com/api/trpc'
        : '/api/trpc',
    }),
  ],
});
