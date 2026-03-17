import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: 'published' },
    include: { seller: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">商品一覧</h1>

        {products.length === 0 ? (
          <p className="text-center text-gray-500">現在公開中の商品はありません。</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex flex-col rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="mb-2 text-lg font-semibold text-gray-900">{product.title}</h2>
                <p className="mb-4 flex-1 text-sm text-gray-600">
                  {product.description.length > 100
                    ? product.description.slice(0, 100) + '...'
                    : product.description}
                </p>
                <p className="text-right text-base font-bold text-gray-900">
                  ¥{product.price.toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
