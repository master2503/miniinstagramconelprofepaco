import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { LoginPage } from './pages/login/login.page';
import { FeedPage } from './pages/feed/feed.page';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'feed', component: FeedPage, canActivate: [authGuard] },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'friends',
    loadComponent: () => import('./pages/friends/friends.page').then( m => m.FriendsPage),
    canActivate: [authGuard]
  }
];
