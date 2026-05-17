export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string;
  collection: string;
  stock: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

export type Order = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};
