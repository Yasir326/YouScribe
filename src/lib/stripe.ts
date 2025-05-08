import { PLANS } from '../config/stripe';
import { db } from '../db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

const DAY_IN_MS = 86_400_000;


export async function getUserSubscriptionPlan() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCancelled: false,
      stripeCurrentPeriodEnd: null,
    };
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCancelled: false,
      stripeCurrentPeriodEnd: null,
    };
  }


  const isSubscribed = Boolean(
    dbUser.stripePriceId &&
      dbUser.stripeCurrentPeriodEnd &&
      dbUser.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now()
  );

const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.production === dbUser.stripePriceId)
    : null

  let isCancelled = false;
  if (isSubscribed && dbUser.stripeSubscriptionID) {
    const stripePlan = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionID)
    isCancelled = stripePlan.cancel_at_period_end
  }


  return {
    ...plan,
    stripeSubscriptionId: dbUser.stripeSubscriptionID,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
    stripeCustomerId: dbUser.stripeCustomerId,
    isSubscribed,
    isCancelled,
  };
}
