"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/categories', label: 'Categorias' },
  { href: '/transactions', label: 'Lançamentos' },
]

export function AppSidebar() {
  const pathname = usePathname()

  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <aside className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">C&Wª</p>
        <h2 className="text-xl font-semibold">Finance</h2>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-2xl px-4 py-3 ${
              pathname === link.href
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-2xl border px-4 py-3 text-slate-700 hover:bg-slate-50"
      >
        Sair
      </button>
    </aside>
  )
}