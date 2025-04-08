"use client"

import { Button } from "@/src/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/app/components/ui/card"
import { motion } from "framer-motion"
import { SparklesCore } from "@/src/app/components/sparkles"
import { Key, Terminal, Lock } from "lucide-react"
import Link from "next/link"
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types'
import Navbar from '../components/Navbar'
import NavbarLoggedIn from '../components/NavbarLoggedIn'

interface ApiGuideClientProps {
  user: KindeUser<Record<string, unknown>>
}

const ApiGuideClient = ({ user }: ApiGuideClientProps) => {

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative">
      {/* Ambient background */}
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
        {/* Navigation */}
        {user ? <NavbarLoggedIn /> : <Navbar />}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold text-white mb-6">API Configuration Guide</h1>
            <p className="text-gray-400 text-lg mb-12">
              Learn how to set up your API tokens and manage your account balance for YouLearnNow&apos;s features.
            </p>

            <div className="space-y-8">
              {/* Step 1 - OpenAI API Key */}
              <Card className="bg-gray-900 border-2 border-gray-800">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-600/20 rounded-full">
                      <Key className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">1. Generate OpenAI API Key</CardTitle>
                      <CardDescription className="text-gray-400">
                        Create an OpenAI API key to enable AI features
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>Visit <Link href="https://platform.openai.com/api-keys" className="text-purple-400 hover:underline">OpenAI API Keys</Link></li>
                    <li>Sign in or create an OpenAI account</li>
                    <li>Click &quot;Create new secret key&quot;</li>
                    <li>Name your key (e.g., &quot;YouLearnNow Integration&quot;)</li>
                    <li>Copy and save your API key securely</li>
                    <li>Add payment method in OpenAI dashboard</li>
                  </ol>
                </CardContent>
              </Card>

              {/* Step 2 - YouLearnNow Token (existing card with updated title) */}
              <Card className="bg-gray-900 border-2 border-gray-800">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-600/20 rounded-full">
                      <Lock className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">2. Configure YouLearnNow</CardTitle>
                      <CardDescription className="text-gray-400">
                        Set up your OpenAI key in YouLearnNow dashboard
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>Go to Dashboard Settings</li>
                    <li>Navigate to &quot;API Configuration&quot;</li>
                    <li>Enter your OpenAI API key</li>
                    <li>Click &quot;Save Configuration&quot;</li>
                  </ol>
                </CardContent>
              </Card>

              {/* API Documentation Link */}
              <div className="text-center">
                <Link href="https://platform.openai.com/docs/api-reference/introduction">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Terminal className="mr-2 h-5 w-5" />
                    View Full API Documentation
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default ApiGuideClient

