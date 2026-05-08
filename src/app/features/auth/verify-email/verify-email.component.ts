import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { SESSION_STORAGE_KEYS } from '../../../core/constants/session-storage.keys';
import { VerifyEmailRequest } from '../../../core/models/auth/verify-email-request';
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'cp-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: '../login/login.component.scss',
})
export class VerifyEmailComponent implements OnDestroy, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private userId: number | null = null;
  private resendCooldownTimerId: ReturnType<typeof setInterval> | null = null;

  /** Bound from optional `?email=` for prefill. */
  readonly emailFromQuery = input<string | undefined>(undefined, { alias: 'email' });

  resendLoading = false;
  resendCooldownSec = 0;

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  get f() {
    return this.form.controls;
  }

  get resendDisabled(): boolean {
    return this.resendLoading || this.resendCooldownSec > 0;
  }

  ngOnInit(): void {
    const raw = sessionStorage.getItem(
      SESSION_STORAGE_KEYS.PENDING_VERIFICATION_USER_ID,
    );
    const id = raw != null ? Number.parseInt(raw, 10) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      void this.router.navigate(['/auth/register']);
      return;
    }
    this.userId = id;

    const preEmail = this.emailFromQuery()?.trim();
    if (preEmail) {
      this.form.patchValue({ email: preEmail });
    }
  }

  ngOnDestroy(): void {
    this.clearResendCooldownTimer();
  }

  private clearResendCooldownTimer(): void {
    if (this.resendCooldownTimerId != null) {
      clearInterval(this.resendCooldownTimerId);
      this.resendCooldownTimerId = null;
    }
  }

  private startResendCooldown(): void {
    this.clearResendCooldownTimer();
    this.resendCooldownSec = 60;
    this.resendCooldownTimerId = setInterval(() => {
      if (this.resendCooldownSec <= 1) {
        this.resendCooldownSec = 0;
        this.clearResendCooldownTimer();
        return;
      }
      this.resendCooldownSec -= 1;
    }, 1000);
  }

  onResend(): void {
    const emailCtrl = this.f['email'];
    if (emailCtrl.invalid) {
      emailCtrl.markAsTouched();
      return;
    }

    const email = (emailCtrl.value as string).trim();
    this.resendLoading = true;
    this.auth
      .resendVerification(email)
      .pipe(finalize(() => (this.resendLoading = false)))
      .subscribe({
        next: (success) => {
          if (success) {
            this.toast.success('Código reenviado. Revisá tu correo.');
            this.startResendCooldown();
          } else {
            this.toast.danger('No se pudo reenviar el código. Intenta de nuevo.');
          }
        },
        error: () => {
          this.toast.danger('No se pudo reenviar el código. Intenta más tarde.');
        },
      });
  }

  onSubmit(): void {
    if (this.userId == null) {
      void this.router.navigate(['/auth/register']);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.f['code'].value as string;
    const request = new VerifyEmailRequest(this.userId, code);

    this.auth.verifyEmail(request).subscribe({
      next: (success) => {
        if (success) {
          sessionStorage.removeItem(
            SESSION_STORAGE_KEYS.PENDING_VERIFICATION_USER_ID,
          );
          void this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'success' },
          });
        } else {
          this.toast.danger('No se pudo verificar el correo. Revisá el código.');
        }
      },
      error: () => {
        this.toast.danger('No se pudo verificar el correo. Intenta de nuevo.');
      },
    });
  }
}
