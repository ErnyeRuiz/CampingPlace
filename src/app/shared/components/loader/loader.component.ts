import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'cp-loader',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  readonly loading = inject(LoadingService);
}
