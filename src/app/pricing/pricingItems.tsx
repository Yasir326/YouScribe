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
  tokenUsage: {
    model: string;
    contextWindow: number;
    typicalUsage: {
      systemPrompt: number;
      transcript: number;
      summary: number;
      totalPerSummary: number;
    };
    estimatedCost: {
      perSummary: string;
      perToken: string;
    };
  };
};

export const pricingItems: PricingItem[] = [
  {
    plan: 'Basic',
    tagline: 'Perfect for getting started.',
    quota: 100,
    price: 7.99,
    isOneTime: false,
    tokenUsage: {
      model: 'GPT-3.5 Turbo',
      contextWindow: 16385,
      typicalUsage: {
        systemPrompt: 500,
        transcript: 4000,
        summary: 1500,
        totalPerSummary: 6000,
      },
      estimatedCost: {
        perSummary: '$0.012',
        perToken: '$0.000002',
      },
    },
    features: [
      {
        text: '100 video summaries',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Standard quality summaries',
        footnote: 'Powered by GPT-3.5 Turbo (16K context)',
      },
      {
        text: 'Priority support',
        negative: true,
      },
      {
        text: '~6,000 tokens per summary',
        footnote: 'Including system prompt, transcript, and summary generation',
      },
      {
        text: 'Extended chat responses',
        negative: true,
      },
    ],
  },
  {
    plan: 'Pro',
    tagline: 'For power users.',
    quota: 500,
    price: 14.99,
    isOneTime: false,
    tokenUsage: {
      model: 'GPT-4o-mini',
      contextWindow: 16385,
      typicalUsage: {
        systemPrompt: 500,
        transcript: 8000,
        summary: 3000,
        totalPerSummary: 11500,
      },
      estimatedCost: {
        perSummary: '$0.12',
        perToken: '$0.00001',
      },
    },
    features: [
      {
        text: '500 video summaries',
      },
      {
        text: 'Mobile-friendly interface',
      },
      {
        text: 'Enhanced quality summaries',
        footnote: 'Powered by GPT-4o-mini (16K context)',
      },
      {
        text: 'Priority support',
      },
      {
        text: '~11,500 tokens per summary',
        footnote: 'Including system prompt, transcript, and summary generation',
      },
      {
        text: 'Extended chat responses',
        footnote: 'Get more detailed answers to your questions',
      },
    ],
  },
];
