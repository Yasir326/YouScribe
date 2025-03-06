"use client"

import { Button } from "@/src/app/components/ui/button"
import { Youtube, Menu, X } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"
import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when pathname changes (user navigates)
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Custom NavLink that closes the menu when clicked
  const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    return (
      <Link
        href={href}
        className="text-gray-300 hover:text-white transition-colors relative group"
        onClick={() => setIsMenuOpen(false)}
      >
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
      </Link>
    )
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10 relative z-50"
    >
      <Link href="/" className="flex items-center space-x-2">
        <Youtube className="w-8 h-8 text-purple-500" />
        <span className="text-white font-medium text-xl">YouLearnNow</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <NavLink href="/how-it-works">How it Works</NavLink>
        <NavLink href="/pricing">Pricing</NavLink>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <LoginLink>
          <Button variant="ghost" className="text-white hover:text-purple-400">
            Sign In
          </Button>
        </LoginLink>
        <RegisterLink>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Get Started</Button>
        </RegisterLink>
      </div>

      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden text-white"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[73px] left-0 right-0 bg-black/95 border-b border-white/10 z-40 max-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-4">
            <MobileNavLink href="/how-it-works">How it Works</MobileNavLink>
            <MobileNavLink href="/pricing">Pricing</MobileNavLink>
            <div className="pt-2 flex flex-col space-y-3">
              <LoginLink>
                <Button 
                  variant="ghost" 
                  className="w-full text-white hover:text-purple-400 justify-start"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Button>
              </LoginLink>
              <RegisterLink>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Button>
              </RegisterLink>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white transition-colors relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  )
}