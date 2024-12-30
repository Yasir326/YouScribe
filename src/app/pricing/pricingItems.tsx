export const pricingItems = [
  {
    plan: 'Basic',
    tagline: 'Perfect for getting started.',
    quota: 100,
    price: 9.99,
    features: [
      {
        text: '100 video summaries per month',
        footnote: 'Reset monthly on billing date',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Standard quality summaries',
      },
      {
        text: 'Priority support',
        negative: true,
      },
      {
        text: 'Unlimited video length',
        negative: true,
      },
    ],
  },
  {
    plan: 'Plus',
    tagline: 'For growing needs.',
    quota: 500,
    price: 14.99,
    features: [
      {
        text: '500 video summaries per month',
        footnote: 'Reset monthly on billing date',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Enhanced quality summaries',
      },
      {
        text: 'Standard support',
      },
      {
        text: 'Extended video length support',
      },
    ],
  },
  {
    plan: 'Pro',
    tagline: 'For power users.',
    quota: 'unlimited',
    price: 19.99,
    features: [
      {
        text: 'Unlimited video summaries',
        footnote: 'No monthly limits',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Highest quality summaries',
      },
      {
        text: 'Priority support',
      },
      {
        text: 'Unlimited video length',
      },
    ],
  },
]