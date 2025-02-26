import { getUserSubscriptionPlan } from "@/src/lib/stripe"
import BillingForm from "@/src/app/components/BillingForm"
import { SparklesCore } from "@/src/app/components/sparkles"
import NavbarLoggedIn from '../../components/NavbarLoggedIn'

const Page = async () => {
  const subscriptionPlan = await getUserSubscriptionPlan()

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative">
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <NavbarLoggedIn />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white text-center">Billing & Subscription</h1>
            <BillingForm subscriptionPlan={subscriptionPlan} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page

