import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'

export default async function Home() {
  const latestProducts = await prisma.product.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Claude Codeで作ったツールを
            <br />
            売買しよう
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            AIで作ったプロダクトをマーケットプレイスで販売・発見しよう
          </p>
          <div className="mt-10">
            <Link
              href="/products"
              className="rounded-md bg-gray-900 px-8 py-3 text-base font-medium text-white hover:bg-gray-700"
            >
              商品を見る
            </Link>
          </div>
        </section>

        {/* 新着商品 */}
        {latestProducts.length > 0 && (
          <section className="pb-24">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">新着商品</h2>
              <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                すべて見る →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex flex-col rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{product.title}</h3>
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
          </section>
        )}
      </main>
    </div>
  )
}
