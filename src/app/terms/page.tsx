import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import TermsOfService from './TermsOfService';

const TermsPage = async () => {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  // Create proper user object or null if not logged in
  const user =
    kindeUser && kindeUser.id
      ? {   
          id: kindeUser.id,
          email: kindeUser.email || undefined,
        }
      : null;

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      <main className="container mx-auto px-4 py-8">
        <TermsOfService user={user} />
      </main>
    </div>
  );
};

export default TermsPage;
