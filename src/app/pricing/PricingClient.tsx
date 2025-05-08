'use client';

import MaxWidthWrapper from '@/src/app/components/MaxWidthWrapper';
import { TooltipProvider } from '@/src/app/components/ui/tooltip';
import { pricingItems } from './pricingItems';
import { cn } from '@/src/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/app/components/ui/tooltip';
import { ArrowRight, Check, HelpCircle, Minus } from 'lucide-react';
import { buttonVariants } from '@/src/app/components/ui/button';
import Navbar from '@/src/app/components/Navbar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import UpgradeButton from '@/src/app/components/UpgradeButton';
import NavbarLoggedIn from '@/src/app/components/NavbarLoggedIn';

interface PricingClientProps {
  user: {
    id?: string;
    email?: string;
  } | null;
}

const PricingClient = ({ user }: PricingClientProps) => {
  // Check if user is actually logged in (has an ID)
  const isLoggedIn = !!user?.id;

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      {isLoggedIn ? <NavbarLoggedIn /> : <Navbar />}
      <MaxWidthWrapper className="mb-8 mt-24 text-center max-w-5xl">
        <div className="mx-auto mb-10 sm:max-w-lg">
          <motion.h1
            className="text-5xl font-bold sm:text-6xl text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Pricing Plans
          </motion.h1>
          <motion.p
            className="mt-5 text-gray-400 sm:text-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Simple monthly subscription. Cancel anytime.
          </motion.p>
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-gray-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          ></motion.div>
        </div>

        <div className="pt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:max-w-3xl mx-auto">
          <TooltipProvider>
            {pricingItems.map(({ plan, tagline, quota, price, features }, index) => (
              <motion.div
                key={plan}
                className={cn('relative rounded-2xl bg-gray-900 shadow-lg border-2', {
                  'border-purple-600 shadow-purple-500/20': plan === 'Pro',
                  'border-gray-600 shadow-white/10': plan === 'Basic',
                })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan === 'Pro' && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}

                <div className="p-5">
                  <h3 className="my-3 text-center font-display text-3xl font-bold text-white">
                    {plan}
                  </h3>
                  <p className="text-gray-400">{tagline}</p>
                  <p className="my-5 font-display text-6xl font-semibold text-white">${price}</p>
                  <p className="text-gray-400">per month</p>
                </div>
                <div className="flex h-20 items-center justify-center border-b border-t border-gray-800 bg-gray-900">
                  <div className="flex items-center space-x-1">
                    <p className="text-gray-400">
                      {quota === 'unlimited' ? 'Unlimited' : quota.toLocaleString()} Summaries
                    </p>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent className="w-60 p-2 bg-gray-800 text-white">
                        <p className="text-sm">
                          Monthly summary quota that resets each billing cycle
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <ul className="my-10 space-y-5 px-8">
                  {features.map(({ text, footnote, negative }) => (
                    <li key={text} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {negative ? (
                          <Minus className="h-6 w-6 text-gray-500" />
                        ) : (
                          <Check className="h-6 w-6 text-purple-500" />
                        )}
                      </div>
                      {footnote ? (
                        <div className="flex items-center space-x-1">
                          <p
                            className={cn('text-gray-400', {
                              'text-gray-500': negative,
                            })}
                          >
                            {text}
                          </p>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <HelpCircle className="h-4 w-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent className="w-60 p-2 bg-gray-800 text-white">
                              <p className="text-sm">{footnote}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <p
                          className={cn('text-gray-400', {
                            'text-gray-500': negative,
                          })}
                        >
                          {text}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-800" />
                <div className="p-5">
                  {isLoggedIn ? (
                    <UpgradeButton />
                  ) : (
                    <Link
                      href="/sign-up"
                      className={buttonVariants({
                        className: 'w-full',
                      })}
                    >
                      Purchase Now
                      <ArrowRight className="h-5 w-5 ml-1.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </TooltipProvider>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default PricingClient;
