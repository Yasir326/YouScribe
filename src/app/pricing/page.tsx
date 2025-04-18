import PricingClient from './PricingClient'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

const PricingPage = async () => {
  const { getUser } = getKindeServerSession()
  const kindeUser = await getUser()
  
  // Convert KindeUser to expected type (null -> undefined)
  const user = {
    id: kindeUser?.id,
    email: kindeUser?.email || undefined
  }

  return (
    <div className='min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]'>
      <main className='container mx-auto px-4 py-8'>
        <PricingClient user={user} />
      </main>
    </div>
  )
}

export default PricingPage