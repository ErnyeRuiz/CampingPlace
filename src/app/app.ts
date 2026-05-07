import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'cp-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
