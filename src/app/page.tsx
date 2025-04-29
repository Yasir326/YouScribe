import HomePageClient from './HomePageClient';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const HomePage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return <HomePageClient user={user} suppressHydrationWarning />;
};

export default HomePage;
