import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Purchase {
  id: string
  company_id: string
  vendor_id: string | null
  purchase_date: string
  status: string
  remarks: string | null
  remittance_info: string | null
  created_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string | null
  barcode: string | null
  imei: string | null
  imei2: string | null
  serial_number: string | null
  grade_code: string | null
  color_code: string | null
  carrier_code: string | null
  purchase_price: number
  deduction_total: number
  additional_total: number
  final_price: number
  remarks: string | null
  is_lost: boolean
  is_repaired: boolean
  created_at: string
}
