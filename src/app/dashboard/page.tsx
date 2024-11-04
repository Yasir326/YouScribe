import { ThemeToggle } from '@/src/app/components/ThemeToggle'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/src/db'
import DashboardClient from './dashboard-client'



export default async function DashboardPage() {

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) redirect('/auth-callback?origin=dashboard')

    const dbUSer = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });
  
    if (!dbUSer) redirect('/auth-callback?origin=dashboard');
    const welcomeMessage = user.given_name ? `Welcome to YouScribe ${user.given_name}` : 'Welcome to YouScribe';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="w-1/3"></div>
        <h1 className="text-3xl font-bold w-1/3 text-center">{welcomeMessage}</h1>
        <div className="w-1/3 flex justify-end">
          <ThemeToggle />
        </div>
      </div>
      <DashboardClient />
    </div>
  )
}
