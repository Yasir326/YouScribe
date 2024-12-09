import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import MaxWidthWrapper from '../components/MaxWidthWrapper';

const PricingPage = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <>
      <MaxWidthWrapper className="mb-8 mt-24 text-center max-w-5xl">
        <div className="mx-auto mb-10 sm:mx-w-lg">
          <h1 className="text-6xl font-bold sm:text-7xl">Pricing</h1>
          <p className="mt-5 text-grey-600">
            Simple pricing for your needs. No hidden fees.
          </p>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the perfect plan for your video summarization needs. Get started instantly with no hidden fees.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {/* Basic Plan */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold leading-8">Basic</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Perfect for getting started with video summaries.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-sm font-semibold">/month</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Up to 100 video summaries per month</p>
          </div>

          {/* Plus Plan */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200 scale-105 shadow-lg">
            <h3 className="text-lg font-semibold leading-8">Plus</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">For users who need more comprehensive coverage.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold">$14.99</span>
              <span className="text-sm font-semibold">/month</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Up to 500 video summaries per month</p>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold leading-8">Pro</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">For power users who need unlimited access.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold">$19.99</span>
              <span className="text-sm font-semibold">/month</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Unlimited video summaries</p>
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default PricingPage;
