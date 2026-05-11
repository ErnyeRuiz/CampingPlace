import { Component, inject, input, OnInit } from '@angular/core';
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
import { AuthService } from '../../../core/services/http/auth.service';
import { ResetPasswordRequest } from '../../../core/models/auth/reset-password-request';
import { authHeroMarkUrl, injectAuthFormBrandLogoUrl } from '../../../core/branding/app-branding';

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'cp-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../login/login.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly authFormBrandLogoUrl = injectAuthFormBrandLogoUrl();
  readonly authHeroMarkUrl = authHeroMarkUrl;

  /** Bound from `?code=`; cuando hay valor, se precarga en el form y el campo queda deshabilitado. */
  readonly codeFromQuery = input<string | undefined>(undefined, { alias: 'code' });

  /** Bound from optional `?email=` for prefill. */
  readonly emailFromQuery = input<string | undefined>(undefined, { alias: 'email' });

  /** True si el código provino de la URL (campo bloqueado). */
  codeLockedFromUrl = false;

  showPassword = false;
  showConfirmPassword = false;

  readonly form: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator() },
  );

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const preEmail = this.emailFromQuery()?.trim();
    if (preEmail) {
      this.form.patchValue({ email: preEmail });
    }

    const preCode = this.codeFromQuery()?.trim();
    if (preCode) {
      this.form.patchValue({ code: preCode });
      this.f['code'].disable();
      this.codeLockedFromUrl = true;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request = new ResetPasswordRequest(
      raw.email,
      String(raw.code ?? '').trim(),
      raw.password,
    );

    this.auth.resetPassword(request).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/auth/login'], {
            queryParams: { reset: 'success' },
            replaceUrl: true,
          });
        }
      },
    });
  }
}
