import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'danger';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, duration = 4500): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration?: number): void { this.show('success', message, duration); }
  info(message: string, duration?: number): void    { this.show('info', message, duration); }
  warning(message: string, duration?: number): void { this.show('warning', message, duration); }
  danger(message: string, duration?: number): void  { this.show('danger', message, duration); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
