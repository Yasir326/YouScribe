export const PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    price: {
      amount: 19.99,
      priceIds: {
        test: process.env.STRIPE_BASIC_PRICE_ID,
        production: ''
      }
    },
    quota: 100
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 'unlimited',
    price: {
      amount: 49.99,
      priceIds: {
        test: process.env.STRIPE_PRO_PRICE_ID,
        production: ''
      }
    }
  }
]
