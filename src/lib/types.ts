// ─────────────────────────────────────────────────────────────────────────────
// Luma – Shared TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

export type VenueType = 'Rooftop' | 'Nightclub' | 'Lounge' | 'Pool Party' | 'Bar';

export interface Venue {
  id: number | string;
  name: string;
  city: string;
  metro: string;
  address?: string;
  type: VenueType;
  price_min: number;
  price?: number; // alias for price_min
  rating: number;
  distance: string;
  about?: string;
  img_url?: string;
  img?: string; // alias for img_url
  lat: number;
  lng: number;
  hot?: boolean;
  tags?: string[];
  active?: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  venue_id: number;
  event_date: string;
  party_size: number;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  confirmation_code: string;
  promo_code?: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  platform_fee: number;
  created_at: string;
  notes?: string;
  venues?: Pick<Venue, 'id' | 'name' | 'city' | 'type' | 'img_url' | 'address'>;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  discount_pct: number;
  max_uses?: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  min_spend?: number;
  venue_id?: number;
  active: boolean;
}

export interface PricingResult {
  venue_id: number;
  venue_name: string;
  guests: number;
  base_price: number;      // cents
  discount: number;        // cents
  discount_type?: string;
  discount_value?: number;
  platform_fee: number;    // cents
  total: number;           // cents
  promo_code_id?: string;
  promo_code?: string;
  currency: string;
  error?: string;
}

export interface BookingResult {
  booking_id: string;
  confirmation_code: string;
  venue_name: string;
  total: number;           // cents
  status: string;
  error?: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'guest' | 'promoter' | 'admin';
  city?: string;
  created_at: string;
}
