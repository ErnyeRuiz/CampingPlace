import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginRequest } from '../../../core/models/auth/login-request';
import { SESSION_STORAGE_KEYS } from '../../../core/constants/session-storage.keys';
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { isAppInternalPath } from '../../../core/utils/return-url';

function formatDurationParts(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return [
    `${days} ${days === 1 ? 'día' : 'días'}`,
    `${hours} ${hours === 1 ? 'hora' : 'horas'}`,
    `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`,
    `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`,
  ].join(', ');
}

/** First integer in the API message (e.g. AdminAccountNotReady(1234)). */
function parseSecondsFromMessage(message: string): number | null {
  const m = message.match(/\d+/);
  if (!m) {
    return null;
  }
  const n = Number.parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

/** Shape of POST /auth/login error JSON (contrato API). */
interface AuthLoginErrorBody {
  success?: boolean;
  statusCode?: number;
  message?: string;
  errorCode?: string;
  data?: unknown;
}

function extractUserIdFromLoginErrorData(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const rec = data as Record<string, unknown>;
  const raw = rec['userId'];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

@Component({
  selector: 'cp-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private adminIntervalId: ReturnType<typeof setInterval> | null = null;

  showPassword = false;

  adminCooldownSeconds: number | null = null; // Time remaining for admin account to be ready
  adminCooldownDone = false; // Flag to indicate if the admin account is ready
  adminFallbackMessage: string | null = null; // Fallback message to display if the admin account is not ready

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() {
    return this.loginForm.controls;
  }

  get adminCooldownLabel(): string {
    if (this.adminCooldownSeconds == null) {
      return '';
    }
    return formatDurationParts(this.adminCooldownSeconds);
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('reset') === 'success') {
      this.toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { reset: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    if (qp.get('verified') === 'success') {
      this.toast.success('Email verificado. Ya podés iniciar sesión.');
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { verified: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  ngOnDestroy(): void {
    this.clearAdminWaitTimer();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private clearAdminWaitTimer(): void {
    if (this.adminIntervalId != null) {
      clearInterval(this.adminIntervalId);
      this.adminIntervalId = null;
    }
  }

  private resetLoginFeedback(): void {
    this.adminCooldownDone = false;
    this.adminFallbackMessage = null;
    this.adminCooldownSeconds = null;
    this.clearAdminWaitTimer();
  }

  private startAdminCountdown(initialSeconds: number): void {
    this.clearAdminWaitTimer();
    this.adminFallbackMessage = null;
    this.adminCooldownDone = false;
    this.adminCooldownSeconds = initialSeconds;
    this.adminIntervalId = setInterval(() => {
      const cur = this.adminCooldownSeconds ?? 0;
      if (cur <= 1) {
        this.adminCooldownSeconds = 0;
        this.adminCooldownDone = true;
        this.clearAdminWaitTimer();
        return;
      }
      this.adminCooldownSeconds = cur - 1;
    }, 1000);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.resetLoginFeedback();

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
        }
      },
      error: (err: HttpErrorResponse) => {
        const body = err.error as AuthLoginErrorBody | null;
        const errorCode = body?.errorCode;

        if (errorCode === 'User.EmailNotVerified') {
          const userId = extractUserIdFromLoginErrorData(body?.data);
          if (userId == null) {
            this.toast.danger(
              'No pudimos iniciar la verificación de correo. Intenta de nuevo.',
            );
            return;
          }
          sessionStorage.setItem(
            SESSION_STORAGE_KEYS.PENDING_VERIFICATION_USER_ID,
            String(userId),
          );
          const email = String(this.f['email'].value ?? '').trim();
          void this.router.navigate(
            ['/verify-email'],
            email ? { queryParams: { email } } : {},
          );
          return;
        }

        if (errorCode === 'User.AdminAccountNotReady') {
          const msg = typeof body?.message === 'string' ? body.message : '';
          const sec = msg ? parseSecondsFromMessage(msg) : null;
          if (sec != null && sec > 0) {
            this.startAdminCountdown(sec);
            return;
          }
          this.adminFallbackMessage =
            msg || 'Tu cuenta de administrador aún no está disponible.';
          return;
        }
      },
    });
  }
}
