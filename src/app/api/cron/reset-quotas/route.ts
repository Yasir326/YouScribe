import { db } from '@/src/db'
import { NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// This endpoint will reset the quota for Basic plan users
// whose subscription period has ended

export async function POST(req: Request) {
  try {
    // Verify the request has proper authorization (secret key)
    const { searchParams } = new URL(req.url)
    const apiKey = searchParams.get('api_key')
    
    // Ensure the request is authorized with the correct API key
    if (apiKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current date
    const now = new Date()
    
    // Find all Basic users whose period has ended
    const usersToReset = await db.user.findMany({
      where: {
        planName: 'Basic',
        stripeCurrentPeriodEnd: {
          lt: now // Less than current date means period has ended
        }
      }
    })
    
    // Process each user whose period has ended
    const updates: Promise<unknown>[] = []
    
    for (const user of usersToReset) {
      // Calculate the new period end date (1 month from now)
      const newPeriodEnd = new Date(now)
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)
      
      // Update the user with reset quota and new period end
      updates.push(
        db.user.update({
          where: { id: user.id },
          data: {
            usedQuota: 0, // Reset the quota
            stripeCurrentPeriodEnd: newPeriodEnd // Set new period end date
          }
        })
      )
    }
    
    // Execute all updates in parallel
    const results = await Promise.all(updates)
    
    return NextResponse.json({
      success: true,
      message: 'Quota reset completed for users with ended periods',
      usersUpdated: results.length,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error resetting quotas:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset quotas',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 