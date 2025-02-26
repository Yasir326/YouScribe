import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '../../db';
import DashboardClient from './dashboard-client';
import NavbarLoggedIn from '../components/NavbarLoggedIn';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Settings } from 'lucide-react';

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
      stripeCurrentPeriodEnd: true
    }
  });

  if (!dbUser) redirect('/auth-callback?origin=dashboard');

  return (
    <div className='min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]'>
      <NavbarLoggedIn />
      <main className='container mx-auto px-4 py-8'>
        <div className="flex justify-between items-center mb-8">
          <h1 className='text-3xl font-bold text-white text-center justify-center'>
            {user.given_name ? `${user.given_name}'s Dashboard` : 'Your Dashboard'}
          </h1>
          <Link href="/settings">
            <Button variant="outline" className="text-gray-300 hover:text-white">
              <Settings className="w-4 h-4 mr-2" />
              API Settings
            </Button>
          </Link>
        </div>

        <DashboardClient hasApiKey={!!dbUser.openaiApiKey} />
      </main>
    </div>
  );
}
