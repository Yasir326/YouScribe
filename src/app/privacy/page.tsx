import PrivacyClient from './PrivacyClient';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const PrivacyPage = async () => {
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
        <PrivacyClient user={user} />
      </main>
    </div>
  );
};

export default PrivacyPage;
