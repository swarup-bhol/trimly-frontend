import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_URLS = [
  '/auth/otp/', '/auth/login', '/auth/register',
  '/auth/forgot-password', '/auth/reset-password', '/auth/refresh',
  '/shops/public', '/slots', '/location/meta', '/legal/',
];

function isPublic(url: string): boolean {
  return PUBLIC_URLS.some(p => url.includes(p));
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const skip = isPublic(req.url);
  const token = auth.getAccessToken();

  const authReq = (token && !skip)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !skip) {
        return auth.refreshToken().pipe(
          switchMap(res => {
            const newToken = res.data?.accessToken;
            if (!newToken) { auth.logout(); return throwError(() => err); }
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retried);
          }),
          catchError(refreshErr => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
