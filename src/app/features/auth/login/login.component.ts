import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { LoginRequest } from '../../../core/models/auth/login-request';

@Component({
  selector: 'cp-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  private readonly fb       = inject(FormBuilder);
  private readonly auth     = inject(AuthService);
  private readonly router   = inject(Router);

  readonly loading      = this.auth.loading;
  readonly errorMessage = signal<string | null>(null);

  showPassword = false;

  readonly loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() { return this.loginForm.controls; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);

    const request = new LoginRequest(
      this.f['email'].value,
      this.f['password'].value,
    );

    this.auth.login(request).subscribe({
      next: (response) => {
        if (response) {
          this.router.navigate(['/campings']);
        } else {
          this.errorMessage.set('Credenciales incorrectas. Verifica tu correo y contraseña.');
        }
      },
      error: () => {
        this.errorMessage.set('Error al iniciar sesión. Intenta de nuevo más tarde.');
      },
    });
  }
}
