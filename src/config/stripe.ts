export const PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    price: {
      amount: 7.99,
      priceIds: {
        test: process.env.STRIPE_BASIC_PRICE_ID,
        production: process.env.STRIPE_BASIC_PRICE_ID,
      },
    },
    quota: 100,
    features: [
      '100 summaries per month',
      'GPT-3.5 Turbo model',
      'Basic API access',
      'Standard support',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 500,
    price: {
      amount: 14.99,
      priceIds: {
        test: process.env.STRIPE_PRO_PRICE_ID,
        production: process.env.STRIPE_PRO_PRICE_ID,
      },
    },
    features: [
      '500 summaries per month',
      'GPT-4o-mini model',
      'Advanced API access',
      'Priority support',
      'Extended chat responses',
    ],
  },
];
