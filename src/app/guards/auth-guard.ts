import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token && token.trim() !== '') {
    // ✅ Si el usuario tiene token, puede acceder
    return true;
  } else {
    // ❌ Si no tiene token, se redirige al login
    router.navigateByUrl('/login');
    return false;
  }
};
