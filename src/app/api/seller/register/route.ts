import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, name },
    update: {},
  })

  const existing = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })

  if (existing) {
    return NextResponse.json({ error: 'Already registered as seller' }, { status: 400 })
  }

  const account = await stripe.accounts.create({ type: 'express' })

  await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      stripeAccountId: account.id,
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${appUrl}/seller/register`,
    return_url: `${appUrl}/dashboard/seller`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
