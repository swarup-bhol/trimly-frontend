export interface AuthResponse {
  token: string;
  role: 'ADMIN' | 'BARBER' | 'CUSTOMER';
  userId: number;
  name: string;
  shopId?: number;
  shopStatus?: string;
  message?: string;
}

export interface Shop {
  id: number;
  ownerName: string;
  shopName: string;
  location: string;
  phone?: string;
  bio?: string;
  emoji?: string;
  color1?: string;
  color2?: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  isOpen: boolean;
  seats: number;
  openTime: string;
  closeTime: string;
  slotMin: number;
  workDays: string;
  rating?: number;
  reviews: number;
  totalBookings: number;
  commissionPct: number;
  subscriptionFee: number;
  plan: string;
  monthlyRev: number;
  services: Service[];
  createdAt?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  duration: number;
  price: number;
  enabled: boolean;
}

export interface Booking {
  id: number;
  shopId: number;
  shopName: string;
  shopEmoji?: string;
  customerName: string;
  customerPhone?: string;
  serviceIds: number[];
  servicesLabel: string;
  slot: string;
  slotId: string;
  bookingDate: string;
  amount: number;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  rating?: number;
  ratingComment?: string;
  createdAt: string;
}

export interface SlotInfo {
  id: string;
  label: string;
  taken: boolean;
  disabled: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  bookingId?: number;
  createdAt: string;
}

export interface AdminStats {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  platformRevenue: number;
  totalCustomers: number;
  recentShops: Shop[];
}
