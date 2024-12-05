import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import MaxWidthWrapper from '../app/components/MaxWidthWrapper';

const PricingPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <>
      <MaxWidthWrapper className="mb-8 mt-24 text-center max-w-5xl">
        <div className="mx-auto mb-10 sm:mx-w-lg">
          <h1 className="text-6xl font-bold sm:text-7xl">Pricing</h1>
          
          </div>
      </MaxWidthWrapper>
    </>
  );
};

export default PricingPage;
