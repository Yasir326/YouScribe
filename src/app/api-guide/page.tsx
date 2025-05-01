import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import ApiGuideClient from './ApiGuideClient';

export default async function ApiGuide() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return null;
  return <ApiGuideClient user={user} />;
}
