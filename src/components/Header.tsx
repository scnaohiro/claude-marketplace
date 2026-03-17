'use client'

import { useAuth, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Header() {
  const { isSignedIn } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Claude Marketplace
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">
            商品一覧
          </Link>

          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                ログイン
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                新規登録
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/seller/products/new"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                出品する
              </Link>
              <UserButton />
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
