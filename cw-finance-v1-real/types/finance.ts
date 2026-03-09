export type CategoryKind = 'Entrada' | 'Saída'

export interface Category {
  id: string
  user_id: string
  name: string
  kind: CategoryKind
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  description: string
  type: CategoryKind
  amount: number
  transaction_date: string
  payment_source: string
  is_fixed: boolean
  created_at: string
  categories?: {
    id: string
    name: string
    kind: CategoryKind
  } | null
}
