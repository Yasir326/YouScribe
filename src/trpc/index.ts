import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { z } from 'zod';
import { absoluteUrl } from '../lib/utils';
import { stripe } from '../lib/stripe';
import { getUserSubscriptionPlan } from '../lib/stripe';
import { PLANS } from '../config/stripe';

// Define the return type for authCallback
type AuthCallbackResult =
  | { success: true; accountMerged?: undefined }
  | { success: true; accountMerged: boolean; error?: string };

export const appRouter = router({
  authCallback: publicProcedure.query<AuthCallbackResult>(async () => {
    try {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id || !user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // First check if user exists by ID
      const dbUserById = await db.user.findUnique({
        where: {
          id: user.id,
        },
      });

      // If user exists by ID, return success
      if (dbUserById) {
        return { success: true };
      }

      // Then check if user exists by email to avoid duplicate emails
      const existingUserByEmail = await db.user.findUnique({
        where: {
          email: user.email,
        },
      });

      // If email already exists but with a different ID, merge the accounts
      if (existingUserByEmail) {
        try {
          // Create new user with the Kinde ID but existing user data
          await db.user.create({
            data: {
              id: user.id,
              email: user.email,
              openaiApiKey: existingUserByEmail.openaiApiKey || null,
              stripePriceId: existingUserByEmail.stripePriceId || null,
              stripeCustomerId: existingUserByEmail.stripeCustomerId || null,
              stripeSubscriptionID: existingUserByEmail.stripeSubscriptionID || null,
              stripeCurrentPeriodEnd: existingUserByEmail.stripeCurrentPeriodEnd || null,
              usedQuota: existingUserByEmail.usedQuota,
            },
          });

          return {
            success: true,
            accountMerged: true,
            error:
              "Account created with your existing plan info, but previous data wasn't migrated to avoid database issues. Contact support if you need access to previous data.",
          };
        } catch (mergeError) {
          console.error('Error merging accounts:', mergeError);
          // If merge fails, still return success so user can continue
          return {
            success: true,
            accountMerged: false,
            error:
              mergeError instanceof Error
                ? mergeError.message
                : 'Unknown error during account merge',
          };
        }
      }

      // If user doesn't exist by ID or email, create a new user
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Auth callback error:', error);

      // Re-throw the error to be handled by the TRPC error handler
      throw error;
    }
  }),

  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),

  createStripeSession: privateProcedure
    .input(z.object({ planName: z.enum(['Basic', 'Pro']) }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { planName } = input;
      const billingUrl = absoluteUrl('/dashboard/billing');

      try {
        if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const dbUser = await db.user.findUnique({
          where: {
            id: userId,
          },
        });

        if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const subscriptionPlan = await getUserSubscriptionPlan();

        if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
          const stripeSession = await stripe.billingPortal.sessions.create({
            customer: dbUser.stripeCustomerId,
            return_url: billingUrl,
          });

          return { url: stripeSession.url };
        }

        const selectedPlan = PLANS.find(plan => plan.name === planName);

        if (!selectedPlan) {
          console.error('Selected plan not found in PLANS configuration');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Plan configuration not found',
          });
        }

        const priceId = selectedPlan.price.priceIds.production;

        if (!priceId) {
          console.error(`Missing STRIPE_${planName.toUpperCase()}_PRICE_ID environment variable`);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Stripe price ID not found - check environment variables',
          });
        }

        try {
          const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            metadata: {
              userId: userId,
              priceId: priceId,
              planName: selectedPlan.name,
            },
          });

          return { url: stripeSession.url };
        } catch (stripeError) {
          console.error('Stripe API error details:', {
            type: stripeError instanceof Error ? stripeError.constructor.name : typeof stripeError,
            message: stripeError instanceof Error ? stripeError.message : 'Unknown error',
            stack: stripeError instanceof Error ? stripeError.stack : undefined,
          });

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: stripeError instanceof Error ? stripeError.message : 'Stripe API call failed',
          });
        }
      } catch (error) {
        console.error('Error creating Stripe session:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create Stripe session',
        });
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
