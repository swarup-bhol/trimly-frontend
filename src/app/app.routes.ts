import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/auth/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'barber',
    canActivate: [authGuard],
    data: { role: 'BARBER' },
    loadComponent: () => import('./features/barber/barber.component').then(m => m.BarberComponent)
  },
  {
    path: 'customer',
    canActivate: [authGuard],
    data: { role: 'CUSTOMER' },
    loadComponent: () => import('./features/customer/customer.component').then(m => m.CustomerComponent)
  },
  { path: '**', redirectTo: '' }
];
