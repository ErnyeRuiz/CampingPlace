import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, merge } from 'rxjs';
import { RoleResponse } from '../../../../core/models/roles/role-response';
import { UserUpdateRequest } from '../../../../core/models/user/user-update-request';
import { RolesService } from '../../../../core/services/http/roles.service';
import { UserService } from '../../../../core/services/http/user.service';
import { ToastService } from '../../../../core/services/toast.service';

const PASSWORD_MIN = 6;

function adminPasswordGroupValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const pwd = String(control.get('password')?.value ?? '').trim();
    const c = String(control.get('confirmPassword')?.value ?? '').trim();
    if (!pwd && !c) {
      return null;
    }
    if (pwd.length < PASSWORD_MIN || c.length < PASSWORD_MIN) {
      return { passwordTooShort: true };
    }
    if (pwd !== c) {
      return { passwordMismatch: true };
    }
    return null;
  };
}

@Component({
  selector: 'cp-admin-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-user-form.component.html',
  styleUrl: './admin-user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersApi = inject(UserService);
  private readonly rolesApi = inject(RolesService);
  private readonly toast = inject(ToastService);

  readonly roles = signal<RoleResponse[]>([]);
  readonly pageLoading = signal(true);
  readonly hidePassword = signal(false);
  readonly userId = signal<number | null>(null);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email]],
      roleId: [null as number | null, Validators.required],
      password: [''],
      confirmPassword: [''],
    },
    { validators: adminPasswordGroupValidator() },
  );

  readonly PASSWORD_MIN = PASSWORD_MIN;

  ngOnInit(): void {
    merge(this.form.controls.password.valueChanges, this.form.controls.confirmPassword.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.updateValueAndValidity({ emitEvent: false }));

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!idParam || Number.isNaN(id)) {
      this.pageLoading.set(false);
      void this.router.navigate(['/admin/users']);
      return;
    }

    this.userId.set(id);

    forkJoin({
      user: this.usersApi.getById(id),
      roles: this.rolesApi.getAll(),
    }).subscribe({
      next: ({ user, roles }) => {
        this.roles.set(roles);
        if (!user) {
          this.pageLoading.set(false);
          this.toast.danger('Usuario no encontrado.');
          void this.router.navigate(['/admin/users']);
          return;
        }
        const roleId =
          user.roleId ?? roles.find((r) => r.name === user.roleName)?.id ?? null;
        this.form.patchValue({
          name: user.name,
          email: user.email,
          roleId,
        });
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
        this.toast.danger('No se pudo cargar el usuario o los roles.');
        void this.router.navigate(['/admin/users']);
      },
    });
  }

  toggleHidePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  inputType(): 'text' | 'password' {
    return this.hidePassword() ? 'password' : 'text';
  }

  submit(): void {
    const id = this.userId();
    if (id === null) {
      return;
    }

    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const pwd = String(raw.password ?? '').trim();
    const roleId = raw.roleId;
    if (roleId === null || roleId === undefined) {
      return;
    }

    const body: UserUpdateRequest = {
      name: String(raw.name ?? '').trim(),
      email: String(raw.email ?? '').trim(),
      roleId,
      password: pwd.length ? pwd : null,
    };

    this.usersApi.updateById(id, body).subscribe({
      next: (ok) => {
        if (ok) {
          this.toast.success('Usuario actualizado.');
          void this.router.navigate(['/admin/users']);
        } else {
          this.toast.danger('No se pudo actualizar el usuario.');
        }
      },
      error: () => this.toast.danger('No se pudo actualizar el usuario.'),
    });
  }
}
