import { getUserSubscriptionPlan } from '@/src/lib/stripe';
import BillingForm from '@/src/app/components/BillingForm';
import { SparklesCore } from '@/src/app/components/sparkles';
import NavbarLoggedIn from '../../components/NavbarLoggedIn';
import { Alert, AlertDescription, AlertTitle } from '@/src/app/components/ui/alert';
import { AlertCircle, CreditCard } from 'lucide-react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';

const Page = async ({ searchParams }: { searchParams: { error?: string } }) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Ensure the user is authenticated
  if (!user || !user.id) redirect('/pricing');

  const subscriptionPlan = await getUserSubscriptionPlan();
  const showNoPlanError = searchParams.error === 'no_plan';

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative">
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <NavbarLoggedIn />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-2 bg-purple-600/20 rounded-full mb-4">
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-white">
                Subscription Management
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Manage your subscription, view billing history, and update your payment method. 
                Your subscription will automatically renew each month unless cancelled.
              </p>
            </div>

            {showNoPlanError && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Subscription Required</AlertTitle>
                <AlertDescription>
                  You need an active subscription to access the dashboard features. 
                  Please select a plan below to continue.
                </AlertDescription>
              </Alert>
            )}

            <BillingForm subscriptionPlan={subscriptionPlan} />

            <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription Details</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  • Monthly billing cycle with automatic renewal
                </p>
                <p>
                  • Cancel anytime - your access continues until the end of your billing period
                </p>
                <p>
                  • Upgrade or downgrade your plan at any time
                </p>
                <p>
                  • All plans include access to our API and dashboard features
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Page;
