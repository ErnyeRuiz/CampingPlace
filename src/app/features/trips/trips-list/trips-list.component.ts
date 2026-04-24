import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TripsService } from '../../../core/services/http/trips.service';
import { ToastService } from '../../../core/services/toast.service';
import { TripResponse } from '../../../core/models/trips/trip-response';
import { TripRequest } from '../../../core/models/trips/trip-request';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'cp-trips-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trips-list.component.html',
  styleUrl: './trips-list.component.scss',
})
export class TripsListComponent implements OnInit {
  private readonly trips = inject(TripsService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  readonly tripsList = signal<TripResponse[]>([]);
  readonly formMode  = signal<FormMode>(null);
  readonly editingId   = signal<number | null>(null);
  /** Pending delete: show confirm in row */
  readonly deleteConfirmId = signal<number | null>(null);

  readonly form: FormGroup = this.fb.group({
    name:      ['', [Validators.required, Validators.maxLength(200)]],
    startDate: ['', Validators.required],
    endDate:   ['', Validators.required],
  }, { updateOn: 'blur' });

  get f() { return this.form.controls; }

  readonly loading = this.trips.loading;

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.trips.getAll().subscribe({
      next: (data) => {
        this.tripsList.set(
          (data ?? []).map((t) => ({
            ...t,
            campsiteSummaries: t.campSiteSummaries ?? [],
            startDate: this.coerceDate(t.startDate as Date & string),
            endDate:   this.coerceDate(t.endDate as Date & string),
          }))
        );
      },
    });
  }

  private coerceDate(d: Date | string): Date {
    if (d instanceof Date) {
      return d;
    }
    return new Date(d);
  }

  startCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset();
  }

  startEdit(t: TripResponse): void {
    this.formMode.set('edit');
    this.editingId.set(t.id);
    this.form.patchValue({
      name: t.name,
      startDate: this.toInputDate(t.startDate as Date & string),
      endDate:   this.toInputDate(t.endDate as Date & string),
    });
  }

  cancelForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
  }

  private toInputDate(d: Date | string): string {
    const x = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(x.getTime())) {
      return '';
    }
    return x.toISOString().slice(0, 10);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, startDate, endDate } = this.form.getRawValue();
    const start = this.parseFormDateOnly(startDate);
    const end   = this.parseFormDateOnly(endDate);
    if (end < start) {
      this.toast.warning('La fecha de fin debe ser posterior o igual al inicio.');
      return;
    }

    const request = new TripRequest(name, startDate, endDate);
    const mode    = this.formMode();

    if (mode === 'create') {
      this.trips.create(request).subscribe({
        next: (id) => {
          if (id != null) {
            this.cancelForm();
            this.router.navigate(['/trips', id]);
          } else {
            this.refresh();
          }
        },
      });
      return;
    }

    if (mode === 'edit') {
      const id = this.editingId();
      if (id == null) return;
      this.trips.update(id, request).subscribe({
        next: () => {
          this.cancelForm();
          this.refresh();
        },
      });
    }
  }

  private parseFormDateOnly(yyyyMmDd: string): Date {
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  doDelete(id: number): void {
    this.trips.delete(id).subscribe({
      next: () => {
        this.deleteConfirmId.set(null);
        this.refresh();
      },
      error: () => this.deleteConfirmId.set(null),
    });
  }
}
