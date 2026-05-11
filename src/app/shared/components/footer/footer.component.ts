import { Component } from '@angular/core';
import { footerWordmarkUrl } from '../../../core/branding/app-branding';

@Component({
  selector: 'cp-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly linkedinUrl = 'https://www.linkedin.com/in/ernye-ruiz-044a9b139';
  readonly footerBrandUrl = footerWordmarkUrl;
}
