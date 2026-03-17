import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const { userId } = await auth()

  if (!token) {
    return <ErrorPage message="無効なダウンロードリンクです" />
  }

  const downloadToken = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      order: { include: { buyer: true } },
      productFile: { include: { product: true } },
    },
  })

  if (!downloadToken) {
    return <ErrorPage message="無効なダウンロードリンクです" />
  }

  if (downloadToken.expiresAt < new Date()) {
    return <ErrorPage message="ダウンロードリンクの有効期限が切れています" />
  }

  if (!userId || downloadToken.order.buyer.clerkId !== userId) {
    return <ErrorPage message="アクセス権限がありません" />
  }

  const { productFile } = downloadToken

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="rounded-lg bg-white p-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">ダウンロード</h1>
          <p className="mb-1 text-gray-700">{productFile.product.title}</p>
          <p className="mb-6 text-sm text-gray-500">{productFile.filename}</p>

          <p className="mb-6 text-xs text-gray-400">
            有効期限: {downloadToken.expiresAt.toLocaleString('ja-JP')}
          </p>

          <a
            href={`/api/download?token=${token}`}
            className="inline-block rounded-md bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            ダウンロードする
          </a>

          <div className="mt-6">
            <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900">
              商品一覧に戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="rounded-lg bg-white p-10 shadow-sm">
          <p className="mb-6 text-gray-700">{message}</p>
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 underline">
            商品一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}
