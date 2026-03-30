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
export type PaymentTransactionType = 'charge' | 'refund'
export type PaymentTransactionStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
export type PromotionType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_delivery'
  | 'buy_x_get_y'
  | 'bundle'

export type AvailabilityStatus =
  | 'available'
  | 'out_of_stock'
  | 'unavailable'
  | 'coming_soon'

export type AlveolesOption =
  | 'customer_brings'
  | 'farm_provides'
  | 'invoiced'
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type ReturnReason =
  | 'defective'
  | 'poor_quality'
  | 'wrong_order'
  | 'wrong_quantity'
  | 'other'
export type ReturnResolution = 'refund' | 'credit' | 'exchange'
export type ReviewRating = 1 | 2 | 3 | 4 | 5

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
  phone: string | null
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
  images: string[]
  base_price: number
  price_tier_1_qty: number | null
  price_tier_1_price: number | null
  price_tier_2_qty: number | null
  price_tier_2_price: number | null
  price_tier_3_qty: number | null
  price_tier_3_price: number | null
  stock_quantity: number
  stock_alert_threshold: number
  is_available: boolean
  is_featured: boolean
  availability_status: AvailabilityStatus
  availability_label: string | null
  restock_note: string | null
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
  delivery_address_id: string | null
  delivery_zone: string | null
  delivery_date: string | null
  delivery_slot: string | null
  delivery_instructions: string | null
  delivery_person_id: string | null
  delivered_at: string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  paid_at: string | null
  subtotal: number
  discount_amount: number
  admin_discount: number
  delivery_fee: number
  total_amount: number
  points_used: number
  points_earned: number
  promo_code: string | null
  promo_id: string | null
  customer_notes: string | null
  admin_notes: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  inventory_reserved_at: string | null
  inventory_released_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_unit: string
  quantity: number
  unit_price: number
  total_price: number
  alveoles_quantity: number
  alveoles_option: AlveolesOption
  created_at: string
}

export interface PaymentTransaction {
  id: string
  order_id: string
  customer_id: string | null
  payment_method: PaymentMethod
  transaction_type: PaymentTransactionType
  status: PaymentTransactionStatus
  amount: number
  currency_code: string
  provider: string | null
  provider_reference: string | null
  note: string | null
  created_by_staff_id: string | null
  created_by_staff_name: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
  paymentTransactions: PaymentTransaction[]
}

export interface AdminOrderDetail extends OrderDetail {
  customer_name: string | null
  customer_email: string | null
  guest_name: string | null
  guest_phone: string | null
}

export interface ReturnRequest {
  id: string
  reference: string
  order_id: string | null
  customer_id: string | null
  status: ReturnStatus
  reason: ReturnReason
  reason_details: string | null
  resolution: ReturnResolution | null
  refund_amount: number | null
  admin_notes: string | null
  processed_at: string | null
  created_at: string
  items?: ReturnItemDetail[]
}

export interface ReturnItemDetail {
  id: string
  return_id: string
  order_item_id: string | null
  quantity: number
  reason: string | null
  product_name: string | null
  product_unit: string | null
  order_item_quantity: number | null
}

export interface AdminReturnDetail extends ReturnRequest {
  customer_name: string | null
  customer_email: string | null
  order_reference: string | null
  items: ReturnItemDetail[]
}

export interface ProductReview {
  id: string
  product_id: string
  customer_id: string
  order_id: string | null
  rating: ReviewRating
  comment: string | null
  is_verified: boolean
  is_published: boolean
  admin_reply: string | null
  created_at: string
}

export interface CustomerProductReview extends ProductReview {
  product_name: string | null
  order_reference: string | null
}

export interface ReviewEligibilityItem {
  order_id: string
  order_reference: string
  order_item_id: string
  product_id: string
  product_name: string
  product_unit: string
  quantity: number
  delivered_at: string | null
  existing_review: CustomerProductReview | null
}

export interface PublicProductReview extends ProductReview {
  customer_name: string | null
}

export interface AdminProductReview extends ProductReview {
  customer_name: string | null
  customer_email: string | null
  order_reference: string | null
  product_name: string | null
}

export interface Promotion {
  id: string
  name: string
  description: string | null
  type: PromotionType
  code: string | null
  value: number
  min_order_amount: number
  max_uses: number | null
  max_uses_per_customer: number
  current_uses: number
  customer_types: CustomerType[] | null
  customer_levels: LoyaltyLevel[] | null
  product_ids: string[] | null
  zones: string[] | null
  is_active: boolean
  is_cumulative: boolean
  starts_at: string
  ends_at: string | null
  created_at: string
}

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  type:
    | 'earned_purchase'
    | 'earned_signup'
    | 'earned_birthday'
    | 'earned_referral'
    | 'earned_review'
    | 'redeemed'
    | 'expired'
    | 'admin_adjustment'
  points: number
  balance_after: number
  description: string | null
  order_id: string | null
  expires_at: string | null
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

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  content_html: string
  segment: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_at: string | null
  sent_at: string | null
  recipients_count: number
  opens_count: number
  clicks_count: number
  created_at: string
}

export interface AdminActivityLog {
  id: string
  staff_id: string | null
  staff_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
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
