import { Metadata } from 'next';
import Navbar from '@/src/app/components/Navbar';
import NavbarLoggedIn from '@/src/app/components/NavbarLoggedIn';

export const metadata: Metadata = {
  title: 'Privacy Policy - YouLearnNow',
  description: 'Privacy Policy for YouLearnNow - YouTube video summarizer',
};

interface PrivacyPolicyProps {
  user: {
    id?: string;
    email?: string;
  } | null;
}

export default function PrivacyPolicy({ user }: PrivacyPolicyProps) {
  const isLoggedIn = !!user?.id;
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      {isLoggedIn ? <NavbarLoggedIn /> : <Navbar />}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-white">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300">
              Welcome to YouLearnNow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We
              respect your privacy and are committed to protecting your personal data.
              committed to protecting your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
            <h3 className="text-xl font-medium mb-2">2.1 Account Information</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4">
              <li>User ID (from Kinde authentication)</li>
              <li>Email address</li>
              <li>OpenAI API key (optional, for cost savings)</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">2.2 Usage Data</h3>
            <ul className="list-disc list-inside text-gray-300">
              <li>Video summaries and transcripts</li>
              <li>Usage quota tracking</li>
              <li>API request history</li>
              <li>Payment information (handled securely by Stripe)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-300 mb-4">We use your data to:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Provide and improve our video summarization service</li>
              <li>Process your payments and manage your subscription</li>
              <li>Track usage quotas and API requests</li>
              <li>Improve our AI models and service quality</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage</h2>
            <p className="text-gray-300 mb-4">
              Your data is stored securely using industry-standard encryption. We use:
            </p>
            <ul className="list-disc list-inside text-gray-300">
              <li>PostgreSQL database for user data and summaries</li>
              <li>Stripe for payment information</li>
              <li>Kinde for authentication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-gray-300 mb-4">We work with trusted third-party services:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Kinde (authentication)</li>
              <li>Stripe (payment processing)</li>
              <li>OpenAI (AI summarization)</li>
              <li>YouTube (video content)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-gray-300">
              We retain your data for as long as your account is active or as needed to provide you
              services. You can request deletion of your data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-300">
              Our service is not intended for children under 13. We do not knowingly collect data
              from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this policy occasionally. We will notify you of any significant changes
              via email or through our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-gray-300">
              For any questions about this privacy policy or our data practices, please contact us
              at:
            </p>
            <p className="text-gray-300 mt-2">youlearnnowapp@gmail.com</p>
          </section>
        </div>
      </main>
    </div>
  );
}
