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
import { AuthService } from '../../../core/services/http/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RegisterRequest, RegisterRole } from '../../../core/models/auth/register-request';
import { SESSION_STORAGE_KEYS } from '../../../core/constants/session-storage.keys';

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
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

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
      return (
        'Tu espacio en la naturaleza merece ser vivido por muchos: vos abrís la puerta del fogón ' +
        'y la comunidad se encarga del resto.'
      );
    }
    if (role === 'customer') {
      return (
        'Como cliente vas a explorar campings, comparar opciones y reservar tu próxima estadía ' +
        'en compañía de otros amantes de la naturaleza.'
      );
    }
    return (
      'Gracias por querer sumarte. Elegí Cliente para viajar y descubrir, ' +
      'o Administrador para dar vida a tu camping desde adentro.'
    );
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
            '¡Cuenta creada! Te enviamos un código a tu correo para verificar tu cuenta.',
          );
          void this.router.navigate(['/verify-email'], {
            queryParams: { email: this.registerForm.value.email },
          });
        } else if (success) {
          this.toast.danger(
            'La cuenta se creó pero no recibimos el identificador. Contactá soporte.',
          );
        }
      },
    });
  }
}
