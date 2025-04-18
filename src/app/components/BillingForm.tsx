"use client"

import type { getUserSubscriptionPlan } from "@/src/lib/stripe"
import { useToast } from "@/src/hooks/use-toast"
import { trpc } from "@/src/app/_trpc/client"
import MaxWidthWrapper from "./MaxWidthWrapper"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Loader2, CreditCard } from "lucide-react"
import { motion } from "framer-motion"

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
  const { toast } = useToast()

  const { mutate: createStripeSession, isPending } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url
      if (!url) {
        toast({
          title: "There was a problem...",
          description: "Please try again in a moment",
          variant: "destructive",
        })
      }
    },
  })

  return (
    <MaxWidthWrapper className="max-w-5xl">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-12"
        onSubmit={(e) => {
          e.preventDefault()
          createStripeSession()
        }}
      >
        <Card className="bg-gray-900 border-2 border-gray-800">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-600/20 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Subscription Plan</CardTitle>
                <CardDescription className="text-gray-400">
                  You are currently on the{" "}
                  <span className="text-purple-400 font-semibold">
                    {subscriptionPlan && 'name' in subscriptionPlan ? subscriptionPlan.name : "Free"}
                  </span> plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col items-start space-y-4 md:flex-row md:justify-between md:space-y-0 border-t border-gray-800 mt-6 pt-6">
            <Button
              type="submit"
              className={`bg-purple-600 hover:bg-purple-700 text-white ${isPending ? "opacity-75" : ""}`}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {subscriptionPlan.isPurchased ? "Manage Subscription" : "Upgrade to PRO"}
            </Button>

            {subscriptionPlan.isPurchased ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-full bg-gray-800 px-4 py-2 text-sm text-gray-300"
              >
              </motion.p>
            ) : null}
          </CardFooter>
        </Card>
      </motion.form>
    </MaxWidthWrapper>
  )
}

export default BillingForm

