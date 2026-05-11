import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { authHeroMarkUrl, injectAuthFormBrandLogoUrl } from '../../../core/branding/app-branding';

@Component({
  selector: 'cp-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly authFormBrandLogoUrl = injectAuthFormBrandLogoUrl();
  readonly authHeroMarkUrl = authHeroMarkUrl;

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.f['email'].value as string;

    this.auth.forgotPassword(email).subscribe({
      next: (success) => {
        if (success) {
          this.toast.success(
            'Si tu correo está registrado, recibirás un código para restablecer la contraseña. Te llevamos al inicio de sesión…',
          );
          setTimeout(() => void this.router.navigate(['/auth/login']), 2200);
        }
      },
    });
  }
}
