import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "../../db"
import DashboardClient from "./dashboard-client"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/server"
import { Button } from "@/src/app/components/ui/button"
import Link from "next/link"
import { Youtube, Settings, User } from "lucide-react"

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) redirect("/auth-callback?origin=dashboard")

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) redirect("/auth-callback?origin=dashboard")

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Youtube className="w-8 h-8 text-purple-500" />
                <span className="text-white font-bold text-xl">YouScribe</span>
              </Link>
              {/* <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Youtube className="w-5 h-5 mr-2" />
                My Videos
              </Button> */}
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button> */}
              {/* <Button variant="ghost" className="text-gray-300 hover:text-white">
                <User className="w-5 h-5 mr-2" />
                {user.given_name || "Profile"}
              </Button> */}
              <LogoutLink postLogoutRedirectURL="/">
                <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Logout
                </Button>
              </LogoutLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">{`${user.given_name}'s ` || "Profile"} Dashboard</h1>
        {user && dbUser && <DashboardClient />}
      </main>
    </div>
  )
}

