'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PurchaseButton({ productId }: { productId: string }) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '購入処理に失敗しました')
        return
      }

      window.location.href = data.url
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="rounded-md bg-gray-900 px-8 py-3 text-base font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '購入する'}
      </button>
    </div>
  )
}
