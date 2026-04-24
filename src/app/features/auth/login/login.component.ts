import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoginRequest } from '../../../core/models/auth/login-request';
import { isAppInternalPath } from '../../../core/utils/return-url';

@Component({
  selector: 'cp-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  readonly loading = this.auth.loading;

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

    const request = new LoginRequest(
      this.f['email'].value,
      this.f['password'].value,
    );

    this.auth.login(request).subscribe({
      next: (response) => {
        if (response) {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          if (returnUrl && isAppInternalPath(returnUrl)) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate(['/campings']);
          }
        } else {
          this.toast.danger('Credenciales incorrectas. Verifica tu correo y contraseña.');
        }
      },
      error: () => {
        this.toast.danger('Error al iniciar sesión. Intenta de nuevo más tarde.');
      },
    });
  }
}
