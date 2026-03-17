'use client'

import { useState } from 'react'

export default function SellerRegisterButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/seller/register', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '登録に失敗しました')
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
        <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '売り手として登録する'}
      </button>
    </div>
  )
}
