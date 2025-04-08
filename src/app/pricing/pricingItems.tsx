export type Feature = {
  text: string;
  footnote?: string;
  negative?: boolean;
}

type PricingItem = {
  plan: string;
  tagline: string;
  quota: number | 'unlimited';
  price: number;
  isOneTime: boolean;
  features: Feature[];
}

export const pricingItems: PricingItem[] = [
  {
    plan: 'Basic',
    tagline: 'Perfect for getting started.',
    quota: 100,
    price: 19.99,
    isOneTime: true,
    features: [
      {
        text: '100 video summaries',
        footnote: 'One-time purchase, no recurring fees',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Standard quality summaries',
        footnote: 'Powered by GPT-3.5',
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
    quota: 300,
    price: 19.99,
    isOneTime: false,
    features: [
      {
        text: '300 video summaries p/m',
        footnote: 'Reset monthly on billing date',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Enhanced quality summaries',
        footnote: 'Powered by GPT-4 Turbo',
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
    price: 49.99,
    isOneTime: true,
    features: [
      {
        text: 'Unlimited video summaries',
        footnote: 'One-time purchase, no recurring fees',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Highest quality summaries',
        footnote: 'Powered by GPT-4',
      },
      {
        text: 'Priority support',
      },
      {
        text: 'Unlimited video length',
      },
      {
        text: 'OpenAI API key configuration',
        footnote: 'Use your own API key for maximum control',
      },
    ],
  },
]