"use client"

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { useSearchParams } from "next/navigation"
import { Button } from "@/src/app/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/src/app/components/ui/alert"
import Link from "next/link"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/" className="text-purple-500 hover:text-purple-400">
              Go back home
            </Link>
          </p>
        </div>

        {error === 'account_exists' && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Already Exists</AlertTitle>
            <AlertDescription>
              An account with this email already exists. Please sign in instead of registering.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8 flex flex-col items-center">
          <LoginLink>
            <Button className="w-64 bg-purple-600 hover:bg-purple-700 text-white">
              Sign in with Kinde
            </Button>
          </LoginLink>
        </div>
      </div>
    </div>
  )
} 