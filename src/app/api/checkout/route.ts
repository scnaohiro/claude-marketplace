import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  productId: z.string().min(1),
})

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { productId } = parsed.data

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { include: { user: true } } },
  })

  if (!product || product.status !== 'published') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // 自分の商品は購入不可
  if (product.seller.user.clerkId === userId) {
    return NextResponse.json({ error: 'Cannot purchase your own product' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: { name: product.title },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${productId}`,
    metadata: {
      productId,
      buyerId: userId,
    },
    // TODO: 本番環境でConnectのOnboarding完了後に有効化
    // payment_intent_data: {
    //   application_fee_amount: Math.floor(price * 0.1),
    //   transfer_data: { destination: stripeAccountId },
    // },
  })

  return NextResponse.json({ url: session.url })
}
