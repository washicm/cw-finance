import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { formatCurrency } from '@/lib/currency'

type DashboardTransaction = {
  id: string
  description: string
  amount: number
  type: 'Entrada' | 'Saída'
  transaction_date: string
  categories: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, categories(name)')
    .eq('user_id', user!.id)
    .gte('transaction_date', monthStart)
    .lte('transaction_date', monthEnd)
    .order('transaction_date', { ascending: false })

  const items = (transactions ?? []) as DashboardTransaction[]
  const income = items.filter((t) => t.type === 'Entrada').reduce((sum, t) => sum + Number(t.amount), 0)
  const expense = items.filter((t) => t.type === 'Saída').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = income - expense

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr] md:p-6">
      <AppSidebar />
      <main className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Visão geral</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Receitas</p>
            <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(income)}</h2>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Despesas</p>
            <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(expense)}</h2>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Saldo</p>
            <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(balance)}</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Últimos lançamentos</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Descrição</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-4">{item.transaction_date}</td>
                    <td className="py-4">{item.description}</td>
                    <td className="py-4">{item.categories?.name ?? '-'}</td>
                    <td className="py-4">{item.type}</td>
                    <td className="py-4 text-right">{formatCurrency(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
