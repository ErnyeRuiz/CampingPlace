import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _count = signal(0);

  readonly isLoading = computed(() => this._count() > 0);

  /**
   * Macrotarea: sale del turno de CD y del “verify” en modo desarrollo (NG0100 con microtareas).
   */
  increment(): void {
    setTimeout(() => this._count.update((n) => n + 1), 0);
  }

  decrement(): void {
    setTimeout(() => this._count.update((n) => Math.max(0, n - 1)), 0);
  }
}
