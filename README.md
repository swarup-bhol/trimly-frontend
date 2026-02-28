# Trimly Frontend — Angular 17

Production-ready Angular 17 frontend for the Trimly barber booking platform.

---

## 🚀 Tech Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Framework  | Angular 17 (Standalone Components) |
| Styling    | SCSS (custom design system)  |
| State      | Angular Signals              |
| HTTP       | HttpClient + Interceptors    |
| Auth       | JWT stored in localStorage   |
| Fonts      | Unbounded + DM Sans (Google Fonts) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/auth.guard.ts          # Route protection
│   │   ├── interceptors/auth.interceptor.ts # JWT injection
│   │   ├── models/models.ts              # TypeScript interfaces
│   │   └── services/
│   │       ├── api.service.ts            # HTTP wrapper
│   │       ├── auth.service.ts           # Login/logout + session
│   │       ├── toast.service.ts          # Toast notifications
│   │       └── notification.service.ts  # Backend notifications
│   ├── features/
│   │   ├── auth/landing.component.ts     # Landing + Auth modal
│   │   ├── admin/admin.component.ts      # Admin dashboard
│   │   ├── barber/barber.component.ts    # Barber dashboard
│   │   └── customer/customer.component.ts # Customer portal
│   ├── app.component.ts                  # Root + toast rack
│   ├── app.config.ts                     # App configuration
│   └── app.routes.ts                     # Routes
├── environments/
│   ├── environment.ts                    # Dev (localhost:8080)
│   └── environment.prod.ts               # Prod (/api proxy)
└── styles.scss                           # Global dark theme
```

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js 18+ 
- Angular CLI: `npm install -g @angular/cli`
- Trimly backend running on `http://localhost:8080`

### Install & Start
```bash
npm install
npm start
# Runs at http://localhost:4200
```

### Production Build
```bash
npm run build:prod
# Output in dist/trimly-frontend/
```

---

## 🔑 Demo Logins

| Role     | Credentials                           |
|----------|---------------------------------------|
| Admin    | admin@trimly.app / admin123           |
| Barber 1 | rajan@blade.com / 1234               |
| Barber 2 | suresh@dapper.com / 1234             |
| Customer | Name: Arjun Mehta, Phone: 9876543210 |

---

## 🎨 Features by Role

### 🏛 Admin
- Platform overview with revenue stats
- Approve/disable barber shops
- View all bookings with commission tracking
- Revenue breakdown per shop

### ✂️ Barber
- Live booking management (accept/reject/complete)
- Service catalog management (add/edit/delete/toggle)
- Business hours & slot configuration
- In-app notifications
- Earnings dashboard
- Shareable booking link

### 👤 Customer
- Browse all active shops with live status
- Multi-service booking flow (3 steps)
- Slot picker with real-time availability
- Booking history with status tracking
- Rating system for completed bookings
- Cancel bookings
- In-app notification feed

---

## 🌐 API Configuration

### Development
In `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Production
Set `apiUrl: '/api'` in `environment.prod.ts` and configure a reverse proxy (nginx/server) to forward `/api` to your Spring Boot backend.

**Example nginx config:**
```nginx
location /api/ {
  proxy_pass http://localhost:8080/api/;
  proxy_set_header Host $host;
}

location / {
  root /path/to/dist/trimly-frontend/browser;
  try_files $uri $uri/ /index.html;
}
```

---

## 🚢 Deployment

### Single-server (Frontend + Backend same server)
1. Build: `npm run build:prod`
2. Serve `dist/trimly-frontend/browser/` via nginx
3. Configure nginx to proxy `/api` to Spring Boot

### Separate servers (CDN + API)
1. Build with correct `apiUrl` in `environment.prod.ts`
2. Upload `dist/trimly-frontend/browser/` to S3/CDN
3. Set CORS `ALLOWED_ORIGINS` in Spring Boot to your CDN domain
# trimly-frontend
