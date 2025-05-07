import { Metadata } from 'next';
import Navbar from '@/src/app/components/Navbar';
import NavbarLoggedIn from '@/src/app/components/NavbarLoggedIn';

export const metadata: Metadata = {
  title: 'Terms of Service - YouLearnNow',
  description: 'Terms of Service for YouLearnNow - YouTube video summarizer',
};

interface TermsOfServiceProps {
  user: {
    id?: string;
    email?: string;
  } | null;
}

export default function TermsOfService({ user }: TermsOfServiceProps) {
  const isLoggedIn = !!user?.id;
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      {isLoggedIn ? <NavbarLoggedIn /> : <Navbar />}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-white">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-300">
              By accessing or using YouLearnNow, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
              If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-gray-300 mb-4">YouLearnNow is an AI-powered service that summarizes YouTube videos. Our service includes:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>YouTube video transcript extraction</li>
              <li>AI-powered video summarization</li>
              <li>Usage quota management</li>
              <li>API access for developers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">To use YouLearnNow, you must create an account. You are responsible for:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Maintaining the security of your account</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your account information is accurate</li>
              <li>Notifying us of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payments</h2>
            <p className="text-gray-300 mb-4">YouLearnNow offers one-time payment plans. By purchasing, you agree to:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Pay the full amount upfront</li>
              <li>Provide accurate billing information</li>
              <li>Accept our refund and cancellation policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-gray-300 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Upload malicious or harmful content</li>
              <li>Violate intellectual property rights</li>
              <li>Attempt to bypass security measures</li>
              <li>Use the service for illegal purposes</li>
              <li>Share your account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-gray-300 mb-4">You retain rights to your content. By using our service, you grant us a license to:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Process and analyze your video summaries</li>
              <li>Store your content and analysis results</li>
              <li>Use anonymized data to improve our service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">YouLearnNow provides its service &quot;as is&quot; without warranties. We are not liable for:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Service interruptions or errors</li>
              <li>Data loss or corruption</li>
              <li>Third-party service issues</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="text-gray-300">
              We may terminate or suspend your account if you violate these terms. Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-300 mt-4">
              <li>Your access will be immediately revoked</li>
              <li>Unused quota may be forfeited</li>
              <li>Your data will be retained per our privacy policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or service notifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-gray-300">
              These terms are governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
            <p className="text-gray-300">
              For questions about these terms, please contact us at:
            </p>
            <p className="text-gray-300 mt-2">
              Email: youlearnnowapp@gmail.com
              Twitter: @YasKTechTips
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 