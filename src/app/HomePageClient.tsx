'use client';

import { Button } from '@/src/app/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Youtube } from 'lucide-react';
import { FloatingPaper } from '@/src/app/components/floating-paper';
import { RoboAnimation } from '@/src/app/components/robo-animation';
import { SparklesCore } from '@/src/app/components/sparkles';
import Navbar from './components/Navbar';
import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';
import NavbarLoggedIn from './components/NavbarLoggedIn';

interface HomePageClientProps {
  user: KindeUser<Record<string, unknown>> | null;
  suppressHydrationWarning?: boolean;
}

export default function HomePageClient({ user, suppressHydrationWarning }: HomePageClientProps) {
  return (
    <main
      className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden"
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {/* Ambient background with moving particles */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10">
        {user ? <NavbarLoggedIn /> : <Navbar />}
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center pt-20 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                You Learn Now:
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  {' '}
                  Absorb YouTube Knowledge Faster
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
            >
              Transform YouTube videos into interactive learning experiences. Dive deeper, retain
              better, and accelerate your learning journey.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <RegisterLink>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                  Get Started
                </Button>
              </RegisterLink>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              How You Learn Now Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Youtube className="w-8 h-8 text-purple-400" />}
                title="Find a Video"
                description="Paste any YouTube URL into YouLearnNow"
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8 text-purple-400" />}
                title="Get Insights"
                description="Our AI analyzes and summarizes the content"
              />
              <FeatureCard
                icon={<FileText className="w-8 h-8 text-purple-400" />}
                title="Learn Faster"
                description="Interact with the content and boost retention"
              />
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Learn Smarter, Not Harder</h2>
                <p className="text-gray-400 text-lg mb-6">
                  YouLearnNow transforms YouTube videos into interactive learning experiences. Dive
                  deeper into content, retain information better, and accelerate your learning
                  journey.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                    AI-powered video summaries
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                    Interactive transcripts
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                    Detailed Action Steps
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Ready to Supercharge Your Learning?
            </h2>
            <RegisterLink>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                Sign Up Today
              </Button>
            </RegisterLink>
          </div>
        </section>

        {/* Floating papers background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingPaper count={6} />
        </div>

        {/* Animated YoutubeLogo */}
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 pointer-events-none hidden sm:block">
          <RoboAnimation />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg text-center">
      <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
