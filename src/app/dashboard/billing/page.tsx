import { getUserSubscriptionPlan } from "@/src/lib/stripe"
import BillingForm from "@/src/app/components/BillingForm"
import { SparklesCore } from "@/src/app/components/sparkles"
import NavbarLoggedIn from '../../components/NavbarLoggedIn'
import { Alert, AlertDescription, AlertTitle } from "@/src/app/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

const Page = async ({ searchParams }: { searchParams: { error?: string } }) => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  
  // Ensure the user is authenticated
  if (!user || !user.id) redirect('/pricing')
  
  const subscriptionPlan = await getUserSubscriptionPlan()
  const showNoPlanError = searchParams.error === 'no_plan'

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
            
            {showNoPlanError && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Subscription Required</AlertTitle>
                <AlertDescription>
                  You need to purchase a plan to access the dashboard features. Please select a plan below to continue.
                </AlertDescription>
              </Alert>
            )}
            
            <BillingForm subscriptionPlan={subscriptionPlan} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Page

