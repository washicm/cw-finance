import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

type PeriodKey = 'today' | '7days' | '30days' | 'month' | 'year'

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

function getFileName(period: PeriodKey) {
  switch (period) {
    case 'today':
      return 'lancamentos_hoje.xlsx'
    case '7days':
      return 'lancamentos_ultimos_7_dias.xlsx'
    case '30days':
      return 'lancamentos_ultimos_30_dias.xlsx'
    case 'year':
      return 'lancamentos_ano_atual.xlsx'
    case 'month':
    default:
      return 'lancamentos_mes_atual.xlsx'
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') as PeriodKey) || 'month'

  const { start, end } = getDateRange(period)

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, description, type, amount, categories(name)')
    .eq('user_id', user.id)
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })

  if (error) {
    return new Response('Erro ao gerar Excel', { status: 500 })
  }

  const rows = (data ?? []).map((item: any) => ({
    Data: item.transaction_date,
    Descrição: item.description,
    Categoria: item.categories?.name ?? '-',
    Tipo: item.type,
    Valor: Number(item.amount),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lançamentos')

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  })

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${getFileName(period)}"`,
    },
  })
}