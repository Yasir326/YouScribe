import { ThemeToggle } from '@/src/app/components/theme-toggle'
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="w-1/3"></div>
        <h1 className="text-3xl font-bold w-1/3 text-center">YouScribe</h1>
        <div className="w-1/3 flex justify-end">
          <ThemeToggle />
        </div>
      </div>
      <DashboardClient />
    </div>
  )
}
