'use client'

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
      className="w-full rounded-xl bg-red-600 px-4 py-3 text-white hover:bg-red-700 transition"
    >
      Sair
    </button>
  )
}