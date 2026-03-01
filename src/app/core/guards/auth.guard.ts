import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = auth.session();
  console.log('[customerGuard] session:', session);
  console.log('[customerGuard] isCustomer:', auth.isCustomer());
  console.log('[customerGuard] role:', session?.user?.role);
  if (auth.isCustomer()) return true;
  if (auth.isBarber())  { router.navigate(['/barber']);  return false; }
  if (auth.isAdmin())   { router.navigate(['/admin']);   return false; }
  router.navigate(['/']);
  return false;
};

export const barberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = auth.session();
  console.log('[barberGuard] session:', session);
  console.log('[barberGuard] isBarber:', auth.isBarber());
  console.log('[barberGuard] role:', session?.user?.role);
  if (auth.isBarber()) return true;
  if (auth.isCustomer()) { router.navigate(['/customer']); return false; }
  if (auth.isAdmin())    { router.navigate(['/admin']);    return false; }
  router.navigate(['/']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = auth.session();
  console.log('[adminGuard] session:', session);
  console.log('[adminGuard] isAdmin:', auth.isAdmin());
  console.log('[adminGuard] role:', session?.user?.role);
  if (auth.isAdmin()) return true;
  if (auth.isCustomer()) { router.navigate(['/customer']); return false; }
  if (auth.isBarber())   { router.navigate(['/barber']);   return false; }
  router.navigate(['/']);
  return false;
};

// kept for any existing imports
export const authGuard: CanActivateFn = customerGuard;
