import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampingService } from '../../core/services';
import { Camping, CampingFilter } from '../../core/models';

@Component({
  selector: 'cp-camping-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './camping-list.component.html',
  styleUrl: './camping-list.component.scss'
})
export class CampingListComponent implements OnInit {
  private readonly campingService = inject(CampingService);

  readonly campings = signal<Camping[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly filter = signal<CampingFilter>({ page: 1, pageSize: 12 });

  readonly isEmpty = computed(() => !this.loading() && this.campings().length === 0);

  ngOnInit(): void {
    this.loadCampings();
  }

  loadCampings(): void {
    this.loading.set(true);
    this.campingService.getAll(this.filter()).subscribe({
      next: result => {
        this.campings.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
