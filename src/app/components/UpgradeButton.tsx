"use client"

import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { trpc } from '../_trpc/client'

const UpgradeButton = () => {
  const {mutate: createStripeSession} = trpc.createStripeSession.useMutation({
    onSuccess: ({url}: {url: string | null}) => {
      window.location.href = url ?? "/dashboard/billing"
    }
  })

  return (
    <Button onClick={async () => await createStripeSession()} className='w-full'>
      Upgrade now <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  )
}


export default UpgradeButton