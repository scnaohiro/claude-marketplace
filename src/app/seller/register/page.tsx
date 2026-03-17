import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SellerRegisterButton from './SellerRegisterButton'

export default async function SellerRegisterPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (user) {
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
    if (sellerProfile) {
      redirect('/dashboard/seller')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">売り手として登録する</h1>
        <p className="mb-8 text-gray-600">
          Stripeアカウントを連携して、商品を販売できるようになります。
        </p>
        <SellerRegisterButton />
      </div>
    </div>
  )
}
