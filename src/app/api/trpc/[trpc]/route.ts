import { appRouter } from '@/src/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ req }),
  });
}

export { handler as GET, handler as POST };
