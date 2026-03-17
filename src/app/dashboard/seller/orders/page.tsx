import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import SellerNav from '../SellerNav'

export default async function SellerOrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } })
  if (!sellerProfile) redirect('/seller/register')

  const orders = await prisma.order.findMany({
    where: { product: { sellerId: sellerProfile.id } },
    include: { product: true, buyer: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <SellerNav current="/dashboard/seller/orders" />

        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-700">注文一覧</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              まだ注文はありません。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-6 py-3 font-medium">注文ID</th>
                    <th className="px-6 py-3 font-medium">商品名</th>
                    <th className="px-6 py-3 font-medium">購入者</th>
                    <th className="px-6 py-3 font-medium text-right">金額</th>
                    <th className="px-6 py-3 font-medium text-right">手数料</th>
                    <th className="px-6 py-3 font-medium text-right">受取額</th>
                    <th className="px-6 py-3 font-medium">日時</th>
                    <th className="px-6 py-3 font-medium">ステータス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {order.product.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.buyer.email}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ¥{order.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        ¥{order.platformFee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        ¥{(order.amount - order.platformFee).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {order.createdAt.toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {order.status === 'completed' ? '完了' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
