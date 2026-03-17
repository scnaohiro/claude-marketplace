import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { clerkClient } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  const body = await req.text()
  const headerPayload = await headers()
  const sig = headerPayload.get('stripe-signature')

  let event: Stripe.Event

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }
  } else {
    // 開発環境：検証スキップ
    try {
      event = JSON.parse(body) as Stripe.Event
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const { productId, buyerId: buyerClerkId } = session.metadata ?? {}

    if (!productId || !buyerClerkId) {
      console.error('Missing metadata in checkout.session.completed', session.id)
      return NextResponse.json({ received: true })
    }

    // Clerkからユーザー情報を取得してupsert（Webhookが未設定でもレコードを作成）
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(buyerClerkId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

    const buyer = await prisma.user.upsert({
      where: { clerkId: buyerClerkId },
      create: { clerkId: buyerClerkId, email, name },
      update: {},
    })

    const amount = session.amount_total ?? 0
    const platformFee = Math.floor(amount * 0.1)

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        productId,
        amount,
        platformFee,
        stripePaymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null,
        status: 'completed',
      },
    })

    const productFiles = await prisma.productFile.findMany({ where: { productId } })

    if (productFiles.length > 0) {
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

      await prisma.downloadToken.createMany({
        data: productFiles.map((file) => ({
          orderId: order.id,
          productFileId: file.id,
          token: uuidv4(),
          expiresAt,
        })),
      })
    }
  }

  return NextResponse.json({ received: true })
}
