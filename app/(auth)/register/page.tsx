"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleRegister} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">C&Wª Finance</p>
          <h1 className="mt-2 text-2xl font-semibold">Criar conta</h1>
        </div>
        <input
          className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          required
        />
        <input
          className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          type="email"
          required
        />
        <input
          className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          type="password"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="h-12 w-full rounded-2xl bg-slate-900 text-white" disabled={loading}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
        <p className="text-sm text-slate-500">
          Já tem conta? <Link href="/login" className="underline">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
