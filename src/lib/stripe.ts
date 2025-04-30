import { PLANS } from '../config/stripe';
import { db } from '../db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  // This is the API version you're configured to use
  // If you're getting errors, use one of the standard versions listed in Stripe docs
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export async function getUserSubscriptionPlan() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return {
      ...PLANS[0],
      isPurchased: false,
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
      isPurchased: false,
    };
  }

  const isPurchased = Boolean(dbUser.stripePriceId);

  const plan = isPurchased
    ? PLANS.find(plan => plan.price.priceIds.test === dbUser.stripePriceId)
    : null;

  return {
    ...plan,
    stripeCustomerId: dbUser.stripeCustomerId,
    isPurchased,
  };
}
