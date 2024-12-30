import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import MaxWidthWrapper from '../components/MaxWidthWrapper';
import { TooltipProvider } from '../components/ui/tooltip';
import { pricingItems } from './pricingItems';
import { PLANS } from '@/src/config/stripe';
import { cn } from '@/src/lib/utils';

const PricingPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <>
      <MaxWidthWrapper className='mb-8 mt-24 text-center max-w-5xl'>
        <div className='mx-auto mb-10 sm:mx-w-lg'>
          <h1 className='text-6xl font-bold sm:text-7xl'>Pricing</h1>
          <p className='mt-5 text-grey-600'>
            Simple pricing for your needs. No hidden fees.
          </p>
        </div>

        <div className='pt-12 grid  grid-cols-1 gap-10 lg:grid-cols-3'>
          <TooltipProvider>
            {pricingItems.map(({ plan, tagline, quota, features }) => {
              const price =
                PLANS.find((p) => p.slug === plan.toLowerCase())?.price
                  .amount || 0;
              return (
                <div
                  key={plan}
                  className={cn('relative rounded-2xl bg-white dark:bg-gray-900 shadow-lg', {
                    'border-2 border-blue-600 shadow-blue-200 dark:shadow-blue-900': plan === 'Pro',
                    'border-2 border-green-600 shadow-green-200 dark:shadow-green-900': plan === 'Plus',
                    'border-2 border-gray-600 shadow-gray-200 dark:shadow-gray-900': plan === 'Basic',
                  })}
                >
                  {plan === 'Pro' && (
                    <div className='absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white'>
                      Upgrade Now
                    </div>
                  )}

                  <div className='p-5'>
                    <h3 className='my-3 text-center font-display text-3xl font-bold dark:text-white'>
                      {plan}
                    </h3>
                    <p className='text-gray-500 dark:text-gray-400'>{tagline}</p>
                    <p className='my-5 font-display text-6xl font-semibold dark:text-white'>${price}</p>
                    <p className='text-gray-500 dark:text-gray-400'>per month</p>
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default PricingPage;
