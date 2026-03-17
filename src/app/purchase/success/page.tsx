import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Header from '@/components/Header'

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  let downloadToken: string | null = null
  let hasFiles = false
  let orderFound = false

  if (session_id) {
    try {
      // Checkout Session からPayment Intent IDを取得
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null

      const order = paymentIntentId
        ? await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
            include: { downloadTokens: { take: 1 } },
          })
        : null

      if (order) {
        orderFound = true
        if (order.downloadTokens.length > 0) {
          hasFiles = true
          downloadToken = order.downloadTokens[0].token
        }
      }
    } catch {
      // セッション取得失敗時はorderFoundのまま false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="rounded-lg bg-white p-10 shadow-sm">
          <div className="mb-6 text-5xl">✓</div>
          <h1 className="mb-3 text-2xl font-bold text-gray-900">購入完了！</h1>
          <p className="mb-8 text-gray-600">ありがとうございました。</p>

          <div className="flex flex-col gap-3">
            {hasFiles && downloadToken ? (
              <Link
                href={`/purchase/download?token=${downloadToken}`}
                className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
              >
                ダウンロードページへ
              </Link>
            ) : orderFound ? (
              <p className="text-sm text-gray-500">
                この商品はダウンロードファイルがありません
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                注文情報を確認中です。しばらくお待ちください。
              </p>
            )}
            <Link
              href="/products"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              商品一覧に戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
