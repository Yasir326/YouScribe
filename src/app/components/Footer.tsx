import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.1] bg-black/[0.96]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              YouLearnNow
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <a 
              href="mailto:youlearnnowapp@gmail.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} YouLearnNow. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 