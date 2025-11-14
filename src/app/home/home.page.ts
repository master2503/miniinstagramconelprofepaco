import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {

  constructor(private router: Router) {}

  startApp() {
    const token = localStorage.getItem('token');
    if (token && token.trim() !== '') {
      // ✅ Si hay token, va directo al feed
      this.router.navigateByUrl('/feed');
    } else {
      // 🔐 Si no hay token, va al login
      this.router.navigateByUrl('/login');
    }
  }
}
