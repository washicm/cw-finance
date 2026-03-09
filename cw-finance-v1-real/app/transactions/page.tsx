"use client"

import { useEffect, useMemo, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/currency'
import type { Category, Transaction } from '@/types/finance'

export default function TransactionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<'Entrada' | 'Saída'>('Saída')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10))

  const filteredCategories = useMemo(() => categories.filter((item) => item.kind === type), [categories, type])

  async function loadData() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const [{ data: transactionsData }, { data: categoriesData }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(id, name, kind)')
        .eq('user_id', auth.user.id)
        .order('transaction_date', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('name'),
    ])

    setTransactions((transactionsData as Transaction[]) ?? [])
    setCategories((categoriesData as Category[]) ?? [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user || !categoryId || !description || !amount) return

    const payload = {
      user_id: auth.user.id,
      category_id: categoryId,
      description,
      type,
      amount: Number(amount),
      transaction_date: transactionDate,
      payment_source: 'Conta',
      is_fixed: false,
    }

    if (editingId) {
      await supabase.from('transactions').update(payload).eq('id', editingId)
    } else {
      await supabase.from('transactions').insert(payload)
    }

    setEditingId(null)
    setDescription('')
    setAmount('')
    setType('Saída')
    setCategoryId('')
    setTransactionDate(new Date().toISOString().slice(0, 10))
    loadData()
  }

  function handleEdit(item: Transaction) {
    setEditingId(item.id)
    setDescription(item.description)
    setAmount(String(item.amount))
    setTransactionDate(item.transaction_date)
    setType(item.type)
    setCategoryId(item.category_id ?? '')
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    loadData()
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const first = filteredCategories[0]?.id ?? ''
    if (!categoryId || !filteredCategories.some((item) => item.id === categoryId)) {
      setCategoryId(first)
    }
  }, [type, categories, filteredCategories, categoryId])

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr] md:p-6">
      <AppSidebar />
      <main className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Financeiro</p>
          <h1 className="text-3xl font-semibold">Lançamentos</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</h2>
            <input className="h-12 w-full rounded-2xl border border-slate-200 px-4" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
            <input className="h-12 w-full rounded-2xl border border-slate-200 px-4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
            <select className="h-12 w-full rounded-2xl border border-slate-200 px-4" value={type} onChange={(e) => setType(e.target.value as 'Entrada' | 'Saída')}>
              <option value="Saída">Saída</option>
              <option value="Entrada">Entrada</option>
            </select>
            <select className="h-12 w-full rounded-2xl border border-slate-200 px-4" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {filteredCategories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <input className="h-12 w-full rounded-2xl border border-slate-200 px-4" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor" />
            <button className="h-12 w-full rounded-2xl bg-slate-900 text-white">{editingId ? 'Salvar alteração' : 'Salvar lançamento'}</button>
          </form>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-semibold">Histórico</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-4">{item.transaction_date}</td>
                      <td className="py-4">{item.description}</td>
                      <td className="py-4">{item.categories?.name ?? '-'}</td>
                      <td className="py-4">{item.type}</td>
                      <td className="py-4 text-right">{formatCurrency(Number(item.amount))}</td>
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
