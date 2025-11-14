import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    // Inicializa el formulario reactivo
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() { }

  /**
   * Se llama al enviar el formulario
   */
  async onRegister() {
    // Validar que el formulario es correcto
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Muestra errores si los hay
      return;
    }

    // Mostrar un indicador de "Cargando..."
    const loading = await this.loadingCtrl.create({
      message: 'Registrando...',
    });
    await loading.present();

    // Llamar al servicio de autenticación
    this.apiService.register(this.registerForm.value).subscribe(
      // Caso de Éxito
      async (response: any) => {
        await loading.dismiss();
        console.log('Usuario registrado:', response);
        // Redirige al usuario a la página principal (ej. /tabs/home)
        this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      // Caso de Error
      async (error: any) => {
        await loading.dismiss();
        
        let errorMessage = 'Error desconocido al registrar.';
        // (Opcional) Leer mensajes de error específicos de la API
        if (error.error && error.error.message) {
           errorMessage = error.error.message;
        }

        this.showAlert('Error de Registro', errorMessage);
      }
    );
  }

  // Helper para mostrar alertas
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Getters para validación fácil en el HTML (null-safe)
  get name() { return this.registerForm.get('name')!; }
  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
}