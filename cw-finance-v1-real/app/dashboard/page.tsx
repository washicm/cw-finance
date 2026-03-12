import Link from 'next/link'
import { redirect } from 'next/navigation'
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

type PeriodKey = 'today' | '7days' | '30days' | 'month' | 'year'
type LimitKey = '10' | '30' | '60'

function getDateRange(period: PeriodKey) {
  const today = new Date()
  const endDate = new Date(today)

  let startDate = new Date(today)

  switch (period) {
    case 'today':
      break
    case '7days':
      startDate.setDate(today.getDate() - 7)
      break
    case '30days':
      startDate.setDate(today.getDate() - 30)
      break
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    case 'month':
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
  }

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  }
}

function getPeriodLabel(period: PeriodKey) {
  switch (period) {
    case 'today':
      return 'Hoje'
    case '7days':
      return 'Últimos 7 dias'
    case '30days':
      return 'Últimos 30 dias'
    case 'year':
      return 'Ano atual'
    case 'month':
    default:
      return 'Mês atual'
  }
}

function normalizeLimit(limit?: string): number {
  if (limit === '30') return 30
  if (limit === '60') return 60
  return 10
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; limit?: string }>
}) {
  const params = (await searchParams) ?? {}
  const period = (params.period as PeriodKey) || 'month'
  const limit = normalizeLimit(params.limit)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { start, end } = getDateRange(period)

  const { data: allTransactions, error: allTransactionsError } = await supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, categories(name)')
    .eq('user_id', user.id)
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })

  if (allTransactionsError) {
    throw new Error(allTransactionsError.message)
  }

  const { data: latestTransactions, error: latestTransactionsError } =
    await supabase
      .from('transactions')
      .select(
        'id, description, amount, type, transaction_date, categories(name)'
      )
      .eq('user_id', user.id)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: false })
      .limit(limit)

  if (latestTransactionsError) {
    throw new Error(latestTransactionsError.message)
  }

  const allItems = (allTransactions ?? []) as DashboardTransaction[]
  const latestItems = (latestTransactions ?? []) as DashboardTransaction[]

  const income = allItems
    .filter((t) => t.type === 'Entrada')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expense = allItems
    .filter((t) => t.type === 'Saída')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expense

  const expensesByCategory: Record<string, number> = {}

  allItems
    .filter((t) => t.type === 'Saída')
    .forEach((t) => {
      const category = t.categories?.name ?? 'Sem categoria'

      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0
      }

      expensesByCategory[category] += Number(t.amount)
    })

  const categoryList = Object.entries(expensesByCategory)
    .map(([name, total]) => ({
      name,
      total,
    }))
    .sort((a, b) => b.total - a.total)

  const periods: { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: '7days', label: '7 dias' },
    { key: '30days', label: '30 dias' },
    { key: 'month', label: 'Mês atual' },
    { key: 'year', label: 'Ano atual' },
  ]

  const limits: { key: LimitKey; label: string }[] = [
    { key: '10', label: '10' },
    { key: '30', label: '30' },
    { key: '60', label: '60' },
  ]

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-[260px_1fr] md:p-6">
      <AppSidebar />

      <main className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Visão geral</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Período selecionado</p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {getPeriodLabel(period)}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {periods.map((item) => {
                  const isActive = item.key === period

                  return (
                    <Link
                      key={item.key}
                      href={`/dashboard?period=${item.key}&limit=${limit}`}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}

                <Link
                  href={`/api/export/transactions?period=${period}`}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Exportar Excel
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Receitas</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {formatCurrency(income)}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Despesas</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {formatCurrency(expense)}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Saldo</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {formatCurrency(balance)}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gastos por categoria</h2>
            <span className="text-sm text-slate-500">
              {categoryList.length} categoria(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {categoryList.length > 0 ? (
              categoryList.map((cat) => {
                const percentage =
                  expense > 0 ? ((cat.total / expense) * 100).toFixed(1) : '0.0'

                return (
                  <div
                    key={cat.name}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">
                        {cat.name}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                      <span>{percentage}% das despesas</span>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-slate-500">Nenhuma despesa no período.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Últimos lançamentos</h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-500">
                Exibindo até {limit} registros
              </span>

              <div className="flex items-center gap-2">
                {limits.map((item) => {
                  const isActive = Number(item.key) === limit

                  return (
                    <Link
                      key={item.key}
                      href={`/dashboard?period=${period}&limit=${item.key}`}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              <Link
                href="/transactions"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Ver todos
              </Link>
            </div>
          </div>

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
                {latestItems.length > 0 ? (
                  latestItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-4">{item.transaction_date}</td>
                      <td className="py-4">{item.description}</td>
                      <td className="py-4">{item.categories?.name ?? '-'}</td>
                      <td className="py-4">{item.type}</td>
                      <td className="py-4 text-right">
                        {formatCurrency(Number(item.amount))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Nenhum lançamento encontrado para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}