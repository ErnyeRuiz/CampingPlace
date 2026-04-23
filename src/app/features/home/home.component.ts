import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampingFilter } from '../../core/models';
import { CampsitesService } from '../../core/services/http/campsites.service';
import { CampsiteResponse } from '../../core/models/campsites/campsite-response';

@Component({
  selector: 'cp-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly campsiteService = inject(CampsitesService);

  readonly campites = signal<CampsiteResponse[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);

  readonly filter = signal<CampingFilter>({ page: 1, pageSize: 12 });

  readonly isEmpty = computed(() => !this.loading() && this.campites().length === 0);

  ngOnInit(): void {
    this.loadCampings();
  }

  loadCampings(): void {
    this.loading.set(true);
    this.campsiteService.getAll().subscribe({
      next: result => {
        debugger;
        this.campites.set(result);
        this.totalCount.set(result.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
