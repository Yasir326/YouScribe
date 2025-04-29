export type Feature = {
  text: string;
  footnote?: string;
  negative?: boolean;
};

type PricingItem = {
  plan: string;
  tagline: string;
  quota: number | 'unlimited';
  price: number;
  isOneTime: boolean;
  features: Feature[];
};

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
        text: 'Use your own OpenAI API key',
        footnote: 'Bring your own API key for additional cost savings',
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
        text: 'Use your own OpenAI API key',
        footnote: 'Bring your own API key for additional cost savings',
      },
    ],
  },
];
