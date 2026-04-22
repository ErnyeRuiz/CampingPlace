import { Component, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampingService } from '../../core/services';
import { Camping } from '../../core/models';

@Component({
  selector: 'cp-camping-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camping-detail.component.html',
  styleUrl: './camping-detail.component.scss'
})
export class CampingDetailComponent implements OnInit {
  private readonly campingService = inject(CampingService);

  readonly id = input.required<number>();

  readonly camping = signal<Camping | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.campingService.getById(this.id()).subscribe({
      next: data => {
        this.camping.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
