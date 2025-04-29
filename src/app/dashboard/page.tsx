import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '../../db';
import DashboardClient from './dashboard-client';
import NavbarLoggedIn from '../components/NavbarLoggedIn';

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) redirect('/auth-callback?origin=dashboard');

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      openaiApiKey: true,
      stripePriceId: true,
      stripeSubscriptionID: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!dbUser) redirect('/auth-callback?origin=dashboard');

  // Check if user has purchased a plan
  const hasPurchasedPlan = Boolean(dbUser.stripePriceId);

  // If user hasn't purchased a plan, redirect to billing page
  if (!hasPurchasedPlan) {
    redirect('/pricing');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarLoggedIn />
      <main className="container mx-auto px-4 py-6 md:py-8 flex-grow">
        <div className="flex justify-center items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            {user.given_name ? `${user.given_name}'s Dashboard` : 'Your Dashboard'}
          </h1>
        </div>

        <DashboardClient hasApiKey={!!dbUser.openaiApiKey} />
      </main>
    </div>
  );
}
