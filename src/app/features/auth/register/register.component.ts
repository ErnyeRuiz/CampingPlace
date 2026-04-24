import { Component, inject, signal } from '@angular/core';
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
import { RegisterRequest } from '../../../core/models/auth/register-request';

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
  private readonly router = inject(Router);

  readonly loading        = this.auth.loading;
  readonly errorMessage   = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  showPassword        = false;
  showConfirmPassword = false;

  readonly registerForm: FormGroup = this.fb.group(
    {
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator() },
  );

  get f() { return this.registerForm.controls; }

  togglePassword():        void { this.showPassword        = !this.showPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);

    const request = new RegisterRequest(
      this.f['name'].value,
      this.f['email'].value,
      this.f['password'].value,
    );

    this.auth.register(request).subscribe({
      next: (success) => {
        if (success) {
          this.successMessage.set('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión…');
          setTimeout(() => this.router.navigate(['/auth/login']), 2200);
        } else {
          this.errorMessage.set('No se pudo crear la cuenta. Intenta de nuevo.');
        }
      },
      error: () => {
        this.errorMessage.set('Error al registrarse. El correo puede estar en uso.');
      },
    });
  }
}
