import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  const expectedRole = route.data?.['role'] as string | undefined;
  if (expectedRole && auth.getRole() !== expectedRole) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
