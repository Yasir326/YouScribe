import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/src/app/components/ui/theme-provider';
import Providers from './components/Providers';
import Footer from './components/Footer';
import { constructMetadata } from '../lib/utils';

const inter = Inter({ subsets: ['latin'] });


export const metadata = constructMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Providers>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </body>
      </Providers>
    </html>
  );
}
