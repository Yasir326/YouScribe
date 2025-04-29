import { Button } from '@/src/app/components/ui/button';
import { Youtube, MessageSquare, FileText, Sparkles, Zap, Clock } from 'lucide-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import NavbarLoggedIn from '../components/NavbarLoggedIn';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';
import { RegisterLink } from '@kinde-oss/kinde-auth-nextjs/server';

interface HowItWorksClientProps {
  user: KindeUser<Record<string, unknown>>;
}

const HowItWorksClient = ({ user }: HowItWorksClientProps) => {
  return (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      {user ? <NavbarLoggedIn /> : <Navbar />}
      <div className="container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            How{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              You Learn Now
            </span>{' '}
            Works
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Transform any YouTube video into an interactive learning experience with AI-powered
            summaries and insights.
          </p>
        </div>

        {/* Steps Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg text-center">
            <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Youtube className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">1. Paste YouTube URL</h3>
            <p className="text-gray-400">
              Simply paste any YouTube video URL into You Learn Now. Our system will process the
              video and extract its content.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg text-center">
            <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">2. Get AI Summary</h3>
            <p className="text-gray-400">
              Our AI analyzes the video content and generates a comprehensive summary with key
              points and actionable steps.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg text-center">
            <div className="bg-purple-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">3. Interactive Learning</h3>
            <p className="text-gray-400">
              Chat with our AI about the video content, ask questions, and deepen your understanding
              through interactive discussions.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Powerful Features at Your Fingertips
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  Smart Summaries
                </h3>
                <p className="text-gray-400">
                  Get comprehensive summaries and actionable insights from any YouTube video.
                  Download them for offline access.
                </p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                  AI Chat Assistant
                </h3>
                <p className="text-gray-400">
                  Ask questions and get detailed explanations about any part of the video content.
                </p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                  Action Steps
                </h3>
                <p className="text-gray-400">
                  Get clear, actionable steps to implement the knowledge from your videos.
                </p>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg">
              <Image
                src="/images/summary.png"
                alt="YouLearnNow Summary Example"
                width={800}
                height={600}
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Summary Mode Section - NEW */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Choose Your Summary Style
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Summary
              </h3>
              <p className="text-gray-400 mb-4">
                Get a concise overview of the video content with brief action steps. Perfect when
                you&apos;re short on time and need the key points fast.
              </p>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <Image
                  src="/images/quick-summary.png"
                  alt="Quick Summary Toggle"
                  width={600}
                  height={100}
                  className="w-full rounded-lg mb-3"
                />
                <p className="text-gray-500 text-sm italic">
                  Toggle the switch to enable Quick Summary mode
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Detailed Summary
              </h3>
              <p className="text-gray-400 mb-4">
                Receive a comprehensive analysis with in-depth explanations and detailed action
                steps. Ideal for deep learning and thorough understanding.
              </p>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <Image
                  src="/images/detailed-summary.png"
                  alt="Detailed Summary Toggle"
                  width={600}
                  height={100}
                  className="w-full rounded-lg mb-3"
                />
                <p className="text-gray-500 text-sm italic">
                  The default mode provides comprehensive insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Your Learning Dashboard
          </h2>
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg">
            <Image
              src="/images/dashboard.png"
              alt="YouLearnNow Dashboard"
              width={1200}
              height={675}
              className="w-full rounded-lg"
            />
          </div>
        </div>

        {/* AI Chat Feature Section */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-6">Interactive AI Chat</h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8">
            Ask questions, get clarifications, and explore topics deeper with our AI assistant that
            understands the video content.
          </p>
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg max-w-3xl mx-auto">
            <Image
              src="/images/chat.png"
              alt="YouLearnNow AI Chat Example"
              width={800}
              height={400}
              className="w-full rounded-lg mb-6"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Learning Smarter?</h2>
          <RegisterLink>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
              Get Started Now
            </Button>
          </RegisterLink>
        </div>
      </div>
    </main>
  );
};

export default HowItWorksClient;
