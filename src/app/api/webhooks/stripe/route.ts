import { db } from '@/src/db'
import { stripe } from '@/src/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { PLANS } from '@/src/config/stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('Stripe-Signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    return new Response(
      `Webhook Error: ${
        err instanceof Error ? err.message : 'Unknown Error'
      }`,
      { status: 400 }
    )
  }

  const session = event.data
    .object as Stripe.Checkout.Session

  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {    
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer?.toString() || null;
    
    // Get the price ID from metadata
    const priceId = session.metadata.priceId
    
    // Determine the plan name based on price ID
    let planName = "Basic" // Default to Basic
    
    // Check if this price ID matches any of our plans in the config
    if (priceId) {
      for (const plan of PLANS) {
        if (plan.price.priceIds.test === priceId || plan.price.priceIds.production === priceId) {
          planName = plan.name
          break
        }
      }
    }
    
    // Reset used quota to 0 when a new plan is purchased
    await db.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        planName: planName, // Store the plan name explicitly
        usedQuota: 0, // Reset quota when purchasing a new plan
      },
    })
  }

  return new Response(null, { status: 200 })
}
