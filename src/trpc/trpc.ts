import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { TRPCError, initTRPC } from '@trpc/server';

// Define the context type
type Context = {
  req?: Request;
};

const t = initTRPC.context<Context>().create();
const middleware = t.middleware;

const isAuthenticated = middleware(async options => {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return options.next({
      ctx: {
        userId: user.id,
        user,
      },
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuthenticated);
