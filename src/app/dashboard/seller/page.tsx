import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import SellerNav from './SellerNav'

export default async function SellerDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  if (!sellerProfile) redirect('/seller/register')

  const products = await prisma.product.findMany({
    where: { sellerId: sellerProfile.id },
    include: { orders: { where: { status: 'completed' } } },
    orderBy: { createdAt: 'desc' },
  })

  const recentOrders = await prisma.order.findMany({
    where: {
      product: { sellerId: sellerProfile.id },
      status: 'completed',
    },
    include: { product: true, buyer: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const totalRevenue = products.reduce(
    (sum, p) => sum + p.orders.reduce((s, o) => s + o.amount, 0),
    0
  )
  const totalOrders = products.reduce((sum, p) => sum + p.orders.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <SellerNav current="/dashboard/seller" />

        {/* サマリー */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">総売上金額</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              ¥{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">総注文数</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{totalOrders}件</p>
          </div>
        </div>

        {/* 商品一覧 */}
        <div className="mb-8 rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-700">出品商品</h2>
            <Link
              href="/dashboard/seller/products/new"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
            >
              新規出品
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              <p>まだ商品がありません。</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-500">¥{product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{product.orders.length}件</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.status === 'published' ? '公開中' : '下書き'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 最近の注文 */}
        {recentOrders.length > 0 && (
          <div className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-700">最近の注文</h2>
              <Link
                href="/dashboard/seller/orders"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                すべて見る →
              </Link>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.product.title}</p>
                    <p className="text-sm text-gray-500">
                      {order.buyer.name ?? order.buyer.email} ·{' '}
                      {order.createdAt.toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">¥{order.amount.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
