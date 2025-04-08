import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { z } from 'zod';
import { absoluteUrl } from '../lib/utils';
import { getUserSubscriptionPlan, stripe } from '../lib/stripe';
import { PLANS } from '../config/stripe';

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email)
      throw new TRPCError({ code: 'UNAUTHORIZED' });

    //check if user exists in DB
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      //create new user
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }
    return { success: true };
  }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
  
  createStripeSession: privateProcedure.mutation(async ({ctx}) => {
    const {userId} = ctx;
    const billingUrl = absoluteUrl('/dashboard/billing');

    try {
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const dbUser = await db.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const subscriptionPlan = await getUserSubscriptionPlan()

      // If user has already purchased, redirect to billing page
      if (subscriptionPlan.isPurchased) {
        return { url: billingUrl }
      }

      const priceId = PLANS.find((plan) => plan.name === 'Pro')?.price.priceIds.test
      
      if (!priceId) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Price ID not found'
        })
      }

      const stripeSession = await stripe.checkout.sessions.create({
        success_url: billingUrl,
        cancel_url: billingUrl,
        payment_method_types: ['card'],
        mode: 'payment',
        billing_address_collection: 'auto',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
        },
      })

      return { url: stripeSession.url }
    } catch (error) {
      console.error('Error creating Stripe session:', error)
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create Stripe session'
      })
    }
  }),

  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

      return file;
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

      await db.file.delete({
        where: {
          id: input.id,
          userId,
        },
      });

      return file;
    }),
});

export type AppRouter = typeof appRouter;
