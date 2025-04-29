'use client';

import { Button } from '@/src/app/components/ui/button';
import { Youtube, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import type React from 'react';
import { useState, useEffect } from 'react';

export default function NavbarLoggedIn() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when pathname changes (user navigates)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
    );
  };

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

      <div className="hidden md:flex justify-center space-x-6">
        <NavLink href="/how-it-works">How it Works</NavLink>
        <NavLink href="/dashboard/billing">Billing</NavLink>
        <NavLink href="/settings">Configure Api Token</NavLink>
        {!isDashboard && <NavLink href="/dashboard">Back to Dashboard</NavLink>}
      </div>

      <div className="hidden md:flex space-x-3">
        <NavLink href="/pricing">
          <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white">
            Upgrade
          </Button>
        </NavLink>
        <LogoutLink postLogoutRedirectURL="/">
          <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white">
            Logout
          </Button>
        </LogoutLink>
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
            <MobileNavLink href="/dashboard/billing">Billing</MobileNavLink>
            <MobileNavLink href="/settings">Configure Api Token</MobileNavLink>
            {!isDashboard && <MobileNavLink href="/dashboard">Back to Dashboard</MobileNavLink>}
            <div className="pt-2 flex flex-col space-y-3">
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Upgrade
                </Button>
              </Link>
              <LogoutLink postLogoutRedirectURL="/">
                <Button
                  variant="outline"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Logout
                </Button>
              </LogoutLink>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white transition-colors relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  );
}
