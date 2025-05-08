import { NextResponse } from 'next/server';
import { stripe } from '@/src/lib/stripe';
import { PLANS } from '@/src/config/stripe';

export async function GET() {
  try {
    // Get a product
    const selectedPlan = PLANS.find(plan => plan.name === 'Pro');
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plan not found in configuration' }, { status: 500 });
    }

    // Get price ID
    const priceId = selectedPlan.price.priceIds.production;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not found in environment variables' },
        { status: 500 }
      );
    }

    // Try to create a session
    try {
      const session = await stripe.checkout.sessions.create({
        success_url: 'http://localhost:3000/dashboard/billing',
        cancel_url: 'http://localhost:3000/dashboard/billing',
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: 'test-user',
          priceId: priceId,
          planName: selectedPlan.name,
        },
      });

      return NextResponse.json({
        success: true,
        url: session.url,
        sessionId: session.id,
      });
    } catch (stripeErr) {
      console.error('Stripe API Error:', stripeErr);
      return NextResponse.json(
        {
          error: 'Stripe API Error',
          details: stripeErr instanceof Error ? stripeErr.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test Stripe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
