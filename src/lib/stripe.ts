import { PLANS } from '../config/stripe'
import { db } from '../db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})

export async function getUserSubscriptionPlan() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user.id) {
    return {
      ...PLANS[0],
      isPurchased: false,
    }
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) {
    return {
      ...PLANS[0],
      isPurchased: false,
    }
  }

  // Check if user has made a payment
  const isPurchased = Boolean(dbUser.stripePriceId)

  const plan = isPurchased
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId)
    : null

  return {
    ...plan,
    stripeCustomerId: dbUser.stripeCustomerId,
    isPurchased,
  }
}