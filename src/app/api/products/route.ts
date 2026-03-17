import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createProductSchema = z.object({
  title: z.string().min(1, '商品タイトルは必須です'),
  description: z.string().min(1, '商品説明は必須です'),
  price: z.number().int().min(1, '価格は1円以上にしてください'),
  status: z.enum(['draft', 'published']).default('draft'),
})

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })

  if (!sellerProfile) {
    return NextResponse.json({ error: 'Seller profile not found' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { title, description, price, status } = parsed.data

  const product = await prisma.product.create({
    data: {
      sellerId: sellerProfile.id,
      title,
      description,
      price,
      status,
    },
  })

  return NextResponse.json({ id: product.id }, { status: 201 })
}
