'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Não foi possível sair. Tente novamente.')
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <LogOut size={17} className="text-slate-500" />
      <span className="text-sm">Sair</span>
    </button>
  )
}