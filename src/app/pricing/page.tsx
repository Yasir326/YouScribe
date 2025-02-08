import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import MaxWidthWrapper from '../components/MaxWidthWrapper';
import { TooltipProvider } from '../components/ui/tooltip';
import { pricingItems } from './pricingItems';
import { PLANS } from '@/src/config/stripe';
import { cn } from '@/src/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { ArrowRight, Check, HelpCircle, Link, Minus } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';
import UpgradeButton from '../components/UpgradeButton';

const PricingPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <>
      <MaxWidthWrapper className='mb-8 mt-16 text-center max-w-7xl'>
        <div className='mx-auto mb-8 sm:max-w-lg'>
          <h1 className='text-5xl font-bold sm:text-6xl'>Pricing</h1>
          <p className='mt-4 text-gray-600 sm:text-lg'>
            Simple pricing for your needs. No hidden fees.
          </p>
        </div>

        <div className='pt-10 grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <TooltipProvider>
            {pricingItems.map(({ plan, tagline, quota, features }) => {
              const price =
                PLANS.find((p) => p.slug === plan.toLowerCase())?.price
                  .amount || 0;
              return (
                <div
                  key={plan}
                  className={cn(
                    'relative rounded-2xl bg-white dark:bg-gray-900 shadow-lg',
                    {
                      'border-2 border-blue-600 shadow-blue-200 dark:shadow-blue-900':
                        plan === 'Pro',
                      'border-2 border-green-600 shadow-green-200 dark:shadow-green-900':
                        plan === 'Plus',
                      'border-2 border-gray-600 shadow-gray-200 dark:shadow-gray-900':
                        plan === 'Basic',
                    }
                  )}
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
                    <p className='text-gray-500 dark:text-gray-400'>
                      {tagline}
                    </p>
                    <p className='my-5 font-display text-6xl font-semibold dark:text-white'>
                      ${price}
                    </p>
                    <p className='text-gray-500 dark:text-gray-400'>
                      per month
                    </p>
                  </div>
                  <div className='flex h-20 items-center justify-center border-b border-t border-gray-200 bg-gray-50 dark:border-gray-800'>
                    <div className='flex items-center space-x-1'>
                      <p className='text-gray-600 dark:text-gray-400'>
                        {quota.toLocaleString()} Requests a month included
                      </p>
                      <Tooltip>
                        <TooltipTrigger className='cursor-default'>
                          <HelpCircle className='h-4 w-4 text-zinc-500' />
                        </TooltipTrigger>
                        <TooltipContent
                          side='bottom'
                          align='end'
                          className='w-60 p-2'
                        >
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            How many requests you can make per month
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <ul className='my-10 space-y-5 px-8'>
                    {features.map(({ text, footnote, negative }) => (
                      <li key={text} className='flex space-x-3'>
                        <div className='flex-shrink-0'>
                          {negative ? (
                            <Minus className='h-6 w-6 text-gray-300' />
                          ) : (
                            <Check className='h-6 w-6 teÏxt-green-500' />
                          )}
                        </div>
                        {footnote ? (
                          <div className='flex items-center space-x-1'>
                            <p
                              className={cn('text-gray-400', {
                                'text-gray-600': negative,
                              })}
                            >
                              {text}
                            </p>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger className='cursor-default'>
                                <HelpCircle className='h-4 w-4 text-zinc-500' />
                              </TooltipTrigger>
                              <TooltipContent className='sm:text-sm'>
                                {footnote}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <p
                            className={cn('text-gray-400', {
                              'text-gray-600': negative,
                            })}
                          >
                            {text}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className='border-t border-gray-200 dark:border-gray-800' />
                  <div className='p-5'>
                    {user ? (
                      <UpgradeButton />
                    ) : (
                      <Link
                        href='/sign-in'
                        className={buttonVariants({
                          className: 'w-full',
                        })}
                      >
                        {user ? 'Upgrade now' : 'Sign up'}
                        <ArrowRight className='h-5 w-5 ml-1.5' />
                      </Link>
                    )}
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
