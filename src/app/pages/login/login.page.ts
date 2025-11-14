import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(private api: ApiService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      alert('Por favor ingresa tus credenciales');
      return;
    }

    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigateByUrl('/feed');
      },
      error: (err) => {
        console.error('Error al iniciar sesión', err);
        alert('Credenciales incorrectas o error de conexión');
      }
    });
  }
}
