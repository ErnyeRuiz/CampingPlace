import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { APP_HOME_PATH } from '../../core/constants/permissions';
import { AuthorizationService } from '../../core/services/authorization.service';

/** Evita redirigir siempre a `/admin/roles`; envía al primer ítem del menú permitido o al home. */
@Component({
  standalone: true,
  template: '',
})
export class AdminEntryRedirectComponent implements OnInit {
  private readonly authz = inject(AuthorizationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const next = this.authz.firstAccessibleAdminPath();
    void this.router.navigateByUrl(next ?? APP_HOME_PATH);
  }
}
