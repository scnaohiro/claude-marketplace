import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import PurchaseButton from './PurchaseButton'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: { include: { user: true } } },
  })

  if (!product || product.status !== 'published') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{product.title}</h1>

          <p className="mb-2 text-sm text-gray-500">
            販売者：{product.seller.user.name ?? product.seller.user.email}
          </p>

          <p className="mb-8 whitespace-pre-wrap text-gray-700">{product.description}</p>

          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <p className="text-2xl font-bold text-gray-900">
              ¥{product.price.toLocaleString()}
            </p>
            <PurchaseButton productId={product.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
