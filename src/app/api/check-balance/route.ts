import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

// Define interfaces for the API responses
interface CostResult {
  amount: {
    value: number;
    currency: string;
  };
}

interface CostBucket {
  results: CostResult[];
}

interface UsageResult {
  input_tokens?: number;
  output_tokens?: number;
}

interface UsageBucket {
  results: UsageResult[];
}

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = await req.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Calculate time range for the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTime = Math.floor(firstDayOfMonth.getTime() / 1000); // Convert to Unix timestamp in seconds
    const endTime = Math.floor(now.getTime() / 1000); // Current time as Unix timestamp

    // Get costs data for the current month
    const costsResponse = await fetch(
      `https://api.openai.com/v1/organization/costs?start_time=${startTime}&end_time=${endTime}&interval=1d`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // If costs API fails, try to at least validate the API key by checking models
    if (!costsResponse.ok) {
      // Try to validate the API key by accessing models
      const modelResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!modelResponse.ok) {
        const errorData = await modelResponse.json();
        return NextResponse.json(
          { error: errorData.error?.message || 'Invalid API key or insufficient permissions' },
          { status: modelResponse.status }
        );
      }

      // API key is valid but can't access billing
      return NextResponse.json({ 
        balance: {
          total_granted: 0,
          total_used: 0,
          total_available: 0,
          limited_access: true
        }
      });
    }

    const costsData = await costsResponse.json();
    
    // Calculate total costs from all buckets
    let totalCost = 0;
    if (costsData.data && costsData.data.length > 0) {
      costsData.data.forEach((bucket: CostBucket) => {
        if (bucket.results && bucket.results.length > 0) {
          bucket.results.forEach(result => {
            if (result.amount && result.amount.value) {
              totalCost += result.amount.value;
            }
          });
        }
      });
    }

    // Get usage data for completions, embeddings, etc.
    // This is optional but provides more detailed token usage information
    const usageTypes = ['completions', 'embeddings', 'chat'];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    for (const type of usageTypes) {
      try {
        const usageResponse = await fetch(
          `https://api.openai.com/v1/organization/usage/${type}?start_time=${startTime}&interval=1d`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          
          if (usageData.data && usageData.data.length > 0) {
            usageData.data.forEach((bucket: UsageBucket) => {
              if (bucket.results && bucket.results.length > 0) {
                bucket.results.forEach(result => {
                  totalInputTokens += result.input_tokens || 0;
                  totalOutputTokens += result.output_tokens || 0;
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type} usage:`, error);
        // Continue with other usage types even if one fails
      }
    }


    const estimatedLimit = 5; // Default to $5 for free tier
    
    return NextResponse.json({ 
      balance: {
        total_granted: estimatedLimit,
        total_used: totalCost,
        total_available: Math.max(0, estimatedLimit - totalCost),
        token_usage: {
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          total_tokens: totalInputTokens + totalOutputTokens
        }
      }
    });
  } catch (error) {
    console.error('Error checking balance:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking the balance' },
      { status: 500 }
    );
  }
} 