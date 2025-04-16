import { db } from '@/src/db'
import { stripe } from '@/src/lib/stripe'
import { headers } from 'next/headers'
import type Stripe from 'stripe'

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
    
    // Reset used quota to 0 when a new plan is purchased
    await db.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeCustomerId: customerId,
        stripePriceId: session.metadata.priceId, // Use metadata for storing price ID
        usedQuota: 0, // Reset quota when purchasing a new plan
      },
    })
  }

  return new Response(null, { status: 200 })
}
