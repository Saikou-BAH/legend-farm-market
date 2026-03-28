export type CustomerType =
  | 'individual'
  | 'retailer'
  | 'restaurant'
  | 'wholesaler'
  | 'hotel'

export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum'
export type StaffRole = 'admin' | 'manager' | 'support' | 'logistics'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type DeliveryType = 'delivery' | 'pickup'
export type PaymentMethod =
  | 'orange_money'
  | 'mtn_money'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'account_credit'
  | 'loyalty_points'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
export type PromotionType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_delivery'
  | 'buy_x_get_y'
  | 'bundle'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface CustomerProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  customer_type: CustomerType
  loyalty_points: number
  loyalty_level: LoyaltyLevel
  credit_balance: number
  credit_limit: number
  is_blacklisted: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string | null
  full_address: string
  city: string
  zone: string
  phone: string | null
  is_default: boolean
  created_at: string
}

export interface StaffProfile {
  id: string
  full_name: string
  email: string
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  unit: string
  images: string[] | null
  base_price: number
  stock_quantity: number
  stock_alert_threshold: number
  is_available: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  reference: string
  customer_id: string | null
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_zone: string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  subtotal: number
  discount_amount: number
  delivery_fee: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  name: string
  description: string | null
  type: PromotionType
  code: string | null
  value: number
  is_active: boolean
  starts_at: string
  ends_at: string | null
  created_at: string
}

export interface DeliveryZone {
  id: string
  name: string
  city: string
  delivery_fee: number
  min_order_amount: number
  estimated_delay: string | null
  available_slots: string[] | null
  available_days: string[] | null
  is_active: boolean
}

export interface ShopSetting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

export interface AdminOrderSummary {
  id: string
  reference: string
  status: OrderStatus
  total_amount: number
  created_at: string
  customer_id: string | null
  customer_name: string | null
}
