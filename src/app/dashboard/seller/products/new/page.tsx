'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewProductPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)

    const form = e.currentTarget
    const data = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      price: Number((form.elements.namedItem('price') as HTMLInputElement).value),
      status: (form.elements.namedItem('status') as HTMLSelectElement).value,
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        if (typeof json.error === 'object') {
          setErrors(json.error)
        } else {
          setErrors({ _: [json.error ?? '送信に失敗しました'] })
        }
        return
      }

      router.push('/dashboard/seller')
    } catch {
      setErrors({ _: ['エラーが発生しました。もう一度お試しください。'] })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">商品を出品する</h1>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
          {errors._ && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{errors._[0]}</p>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              商品タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              商品説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              価格（円） <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={1}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price[0]}</p>}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              公開設定
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? '送信中...' : '出品する'}
          </button>
        </form>
      </div>
    </div>
  )
}
