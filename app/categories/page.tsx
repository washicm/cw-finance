"use client"

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/finance'

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'Entrada' | 'Saída'>('Saída')
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadData() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('name')
    setCategories((data as Category[]) ?? [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user || !name.trim()) return

    if (editingId) {
      await supabase
        .from('categories')
        .update({ name: name.trim(), kind })
        .eq('id', editingId)
    } else {
      await supabase.from('categories').insert({
        user_id: auth.user.id,
        name: name.trim(),
        kind,
      })
    }

    setName('')
    setKind('Saída')
    setEditingId(null)
    loadData()
  }

  function handleEdit(item: Category) {
    setEditingId(item.id)
    setName(item.name)
    setKind(item.kind)
  }

  async function handleDelete(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr] md:p-6">
      <AppSidebar />
      <main className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Cadastros</p>
          <h1 className="text-3xl font-semibold">Categorias</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>
            <input className="h-12 w-full rounded-2xl border border-slate-200 px-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" />
            <select className="h-12 w-full rounded-2xl border border-slate-200 px-4" value={kind} onChange={(e) => setKind(e.target.value as 'Entrada' | 'Saída')}>
              <option value="Saída">Saída</option>
              <option value="Entrada">Entrada</option>
            </select>
            <button className="h-12 w-full rounded-2xl bg-slate-900 text-white">{editingId ? 'Salvar categoria' : 'Criar categoria'}</button>
          </form>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-semibold">Lista de categorias</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-4">{item.name}</td>
                      <td className="py-4">{item.kind}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-xl border px-4 py-2" onClick={() => handleEdit(item)} type="button">Editar</button>
                          <button className="rounded-xl border px-4 py-2" onClick={() => handleDelete(item.id)} type="button">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
