import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import HowItWorksClient from './HowItWorksClient';

export default async function HowItWorks() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return null;
  return <HowItWorksClient user={user} />;
}
