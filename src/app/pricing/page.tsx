import PricingClient from './PricingClient'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import NavbarLoggedIn from '../components/NavbarLoggedIn'

const PricingPage = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  return (
    <div className='min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]'>
      <NavbarLoggedIn />
      <main className='container mx-auto px-4 py-8'>
        <PricingClient user={user} />
      </main>
    </div>
  )
}

export default PricingPage