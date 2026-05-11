import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RegisterRequest, RegisterRole } from '../../../core/models/auth/register-request';
import { SESSION_STORAGE_KEYS } from '../../../core/constants/session-storage.keys';
import { authHeroMarkUrl, injectAuthFormBrandLogoUrl } from '../../../core/branding/app-branding';

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'cp-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly authFormBrandLogoUrl = injectAuthFormBrandLogoUrl();
  readonly authHeroMarkUrl = authHeroMarkUrl;

  showPassword        = false;
  showConfirmPassword = false;

  readonly registerForm: FormGroup = this.fb.group(
    {
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role:            [null as RegisterRole | null, [Validators.required]],
    },
    { validators: passwordMatchValidator() },
  );

  get f() { return this.registerForm.controls; }

  /** Texto del panel izquierdo según el tipo de cuenta elegido. */
  get registerHeroParagraph(): string {
    const role = this.f['role'].value as RegisterRole | null;
    if (role === 'admin') {
      return this.transloco.translate('auth.register.heroAdmin');
    }
    if (role === 'customer') {
      return this.transloco.translate('auth.register.heroCustomer');
    }
    return this.transloco.translate('auth.register.heroDefault');
  }

  togglePassword():        void { this.showPassword        = !this.showPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const role = this.f['role'].value as RegisterRole;
    const request = new RegisterRequest(
      this.f['name'].value,
      this.f['email'].value,
      this.f['password'].value,
      role,
    );

    this.auth.register(request).subscribe({
      next: ({ success, userId }) => {
        if (success && userId != null) {
          sessionStorage.setItem(
            SESSION_STORAGE_KEYS.PENDING_VERIFICATION_USER_ID,
            String(userId),
          );
          this.toast.success(
            this.transloco.translate('toast.registerSuccess'),
          );
          void this.router.navigate(['/verify-email'], {
            queryParams: { email: this.registerForm.value.email },
          });
        } else if (success) {
          this.toast.danger(
            this.transloco.translate('toast.registerNoUserId'),
          );
        }
      },
    });
  }
}
