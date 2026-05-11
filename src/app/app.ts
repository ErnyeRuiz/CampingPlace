import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'cp-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** Inicializa idioma persistente (`LanguageService`) al arrancar la app. */
  private readonly _language = inject(LanguageService);
}
