import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '../../db';
import NavbarLoggedIn from '../components/NavbarLoggedIn';
import ApiKeyForm from '../dashboard/apiKeyForm';
import { Info } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) redirect('/auth-callback?origin=settings');

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

  if (!dbUser) redirect('/auth-callback?origin=settings');

  return (
    <div className='min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]'>
      <NavbarLoggedIn />
      <main className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8 text-white text-center'>API Settings</h1>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 bg-gray-900 rounded-lg border-2 border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">OpenAI API Configuration</h2>
            <ApiKeyForm hasExistingKey={!!dbUser.openaiApiKey} />
          </div>
        </div>
        
        {/* API Guide Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/api-guide" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Info className="w-4 h-4 mr-2" />
            <span>Need help configuring your OpenAI API key? Check our API Guide</span>
          </Link>
        </div>
      </main>
    </div>
  );
} 