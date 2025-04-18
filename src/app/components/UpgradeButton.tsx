"use client"

import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { trpc } from '../_trpc/client'
import { useToast } from '@/src/hooks/use-toast'
import { useState } from 'react'

const UpgradeButton = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({url}: {url: string | null}) => {
      if (url) {
        window.location.href = url
      } else {
        setIsLoading(false)
        toast({
          title: 'Error creating checkout session',
          description: 'Please try again later',
          variant: 'destructive'
        })
      }
    },
    onError: (error) => {
      console.error('Stripe session error:', error)
      setIsLoading(false)
      toast({
        title: 'Error creating checkout session',
        description: error.message || 'Please try again later',
        variant: 'destructive'
      })
    }
  })

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      await createStripeSession()
    } catch (error) {
      console.error('Failed to start checkout:', error)
      setIsLoading(false)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Button 
      onClick={handleUpgrade} 
      className='w-full'
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Processing...
        </>
      ) : (
        <>
          Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
        </>
      )}
    </Button>
  )
}


export default UpgradeButton