export const PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    price: {
      amount: 9.99,
      priceIds: {
        test: process.env.STRIPE_BASIC_PRICE_ID,
        production: ''
      }
    },
    quota: 100
  },
  {
    name: 'Plus',
    slug: 'plus',
    price: {
      amount: 14.99,
      priceIds: {
        test: process.env.STRIPE_PLUS_PRICE_ID,
        production: ''
      }
    },
    quota: 500
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 'unlimited',
    price: {
      amount: 19.99,
      priceIds: {
        test: process.env.STRIPE_PRO_PRICE_ID,
        production: ''
      }
    }
  }
]
