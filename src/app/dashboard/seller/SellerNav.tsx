import Link from 'next/link'

const links = [
  { href: '/dashboard/seller', label: '商品管理' },
  { href: '/dashboard/seller/orders', label: '注文一覧' },
  { href: '/dashboard/seller/products/new', label: '新規出品' },
]

export default function SellerNav({ current }: { current: string }) {
  return (
    <nav className="mb-8 flex gap-1 border-b border-gray-200">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            current === link.href
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
