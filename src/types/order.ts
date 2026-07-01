export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'served' | 'cancelled' | 'completed';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_id: string;
  menu_item_id: string | null;
  option_id: string | null;
  qty: number;
  unit_price: number;
  notes: string | null;
}

export interface Order {
  id: string;
  tenant_id: string;
  table_id: string | null;
  handled_by: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  type: OrderType;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  delivery_address: string | null;
  delivery_fee: number;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  created_at: string;
  order_number: number; // Auto-incrementing order number
  
  // Relations / Joined data
  items?: OrderItem[];
}
