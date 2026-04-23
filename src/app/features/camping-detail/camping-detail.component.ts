import { Component, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampsitesService } from '../../core/services/http/campsites.service';
import { CampsiteResponse } from '../../core/models/campsites/campsite-response';

@Component({
  selector: 'cp-camping-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camping-detail.component.html',
  styleUrl: './camping-detail.component.scss'
})
export class CampingDetailComponent implements OnInit {
  private readonly campsiteService = inject(CampsitesService);

  readonly id = input.required<number>();
  readonly campsite = signal<CampsiteResponse | null>(null);

  ngOnInit(): void {
    this.campsiteService.getbyId(this.id()).subscribe({
      next: data => {
        this.campsite.set(data);
      },
    });
  }
}
