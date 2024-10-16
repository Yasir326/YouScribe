import Link from 'next/link'
import { Button } from './ui/button'
import { LoginLink, RegisterLink, LogoutLink } from '@kinde-oss/kinde-auth-nextjs/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

const Navbar = async () => {
  const { isAuthenticated } = getKindeServerSession()
  const authenticated = await isAuthenticated()

  return (
    <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-border bg-background/75 backdrop-blur-lg transition-all">
      <div className="container mx-auto">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex z-40 font-semibold">
            <span>YouScribe</span>
          </Link>
          <div className="hidden items-center space-x-4 sm:flex">
            {authenticated ? (
              <LogoutLink>
                <Button variant="ghost" size="sm">
                  Sign Out
                </Button>
              </LogoutLink>
            ) : (
              <>
                <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
                <LoginLink>
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </LoginLink>
                <RegisterLink>
                  <Button size="sm">
                    Get Started
                  </Button>
                </RegisterLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
