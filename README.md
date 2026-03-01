# Trimly Frontend — Angular 17

Dark-themed barbershop booking platform frontend.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run dev server (connects to backend on :8080 by default)
npm start

# Open: http://localhost:4200
```

## 📁 Project Structure

```
src/app/
├── core/
│   ├── models/models.ts          # All TypeScript interfaces (matches backend DTOs)
│   ├── services/
│   │   ├── auth.service.ts       # JWT + refresh token + persistent sessions
│   │   ├── shop.service.ts       # Shop browse, slots, barber shop mgmt
│   │   ├── booking.service.ts    # Booking CRUD, ratings, reschedule
│   │   └── toast.service.ts      # Global toast notifications
│   ├── interceptors/
│   │   └── auth.interceptor.ts   # Attaches JWT, handles 401 → silent refresh
│   └── guards/
│       └── auth.guard.ts         # Role-based route protection
│
├── features/
│   ├── landing/                  # Landing page (hero, features, role cards)
│   ├── auth/                     # Auth modal (OTP + email login + barber registration)
│   ├── policy/                   # Terms/Privacy/Refund pages
│   ├── customer/
│   │   ├── customer.component.ts # Shell + mobile nav
│   │   ├── browse/               # Shop grid, search, city/area filter, nearby map
│   │   ├── booking/              # 4-step booking wizard
│   │   ├── history/              # My bookings + rating card
│   │   └── notifications/        # WhatsApp-style notification cards
│   ├── barber/
│   │   └── barber.component.ts   # Full barber dashboard (7 sections in one file)
│   └── admin/
│       └── admin.component.ts    # Admin panel (shops, bookings, revenue)
│
└── shared/
    └── components/
        ├── topbar/               # Sticky header with user pill + logout menu
        ├── toast/                # Toast notification rack
        ├── badge/                # Status badges (colour-coded)
        ├── rating-card/          # Interactive star rating + written review
        └── footer/               # Legal links footer
```

## 🔐 Session Strategy

- Login → stores `accessToken` + `refreshToken` in `localStorage`
- App open → auto-login from localStorage, **no OTP required**
- Access token nearing expiry → HTTP interceptor silently calls `/auth/refresh`
- Session ends **only** on explicit Logout button
- "Logout all devices" option also available

## 🌐 API Base URL

Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // ← change this
};
```

For production, set `apiUrl: '/api'` and proxy your backend.

## 🗺️ Maps

Uses **Leaflet + OpenStreetMap** (free, no API key needed).
Map appears when customer taps "Near Me" and grants location permission.

## 🧑‍💻 Demo Accounts

Seeded by the backend on first run:

| Role     | Credentials                    |
|----------|-------------------------------|
| Admin    | admin@trimly.app / admin123    |
| Barber 1 | rajan@blade.com / barber123    |
| Barber 2 | suresh@dapper.com / barber123  |
| Customer | WhatsApp OTP on 9811111111     |

## 📦 Build for Production

```bash
npm run build:prod
# Output: dist/trimly-frontend/
```
