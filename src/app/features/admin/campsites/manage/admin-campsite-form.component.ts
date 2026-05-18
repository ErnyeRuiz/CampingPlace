import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { APP_HOME_PATH, PERMISSIONS } from '../../../../core/constants/permissions';
import { AuthorizationService } from '../../../../core/services/authorization.service';
import { CampsitesService } from '../../../../core/services/http/campsites.service';
import { LocationService } from '../../../../core/services/http/location.service';
import { CampsiteFormFields } from '../../../../core/models/campsites/campsite-request';
import { CampsiteImageResponse } from '../../../../core/models/campsites/campsite-image-response';
import { UbicacionCatalog } from '../../../../core/models/location/ubicacion-catalog';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'cp-admin-campsite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './admin-campsite-form.component.html',
  styleUrl: './admin-campsite-form.component.scss',
})
export class AdminCampsiteFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campsitesApi = inject(CampsitesService);
  private readonly locationApi = inject(LocationService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authz = inject(AuthorizationService);
  private readonly transloco = inject(TranslocoService);

  catalog: UbicacionCatalog | null = null;
  campsiteId: number | null = null;

  get canSubmit(): boolean {
    if (this.campsiteId === null) {
      return this.authz.hasPermission(PERMISSIONS.CampsiteCreate);
    }
    return this.authz.hasPermission(PERMISSIONS.CampsiteUpdate);
  }

  existingImages: CampsiteImageResponse[] = [];
  /** Image ids the user chose to keep (subset of existing); empty set = remove all current images on save. */
  readonly imageIdsToKeep = new Set<number>();
  newImageFiles: File[] = [];
  newImagePreviewUrls: string[] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    latitude: [9.934739, [Validators.required]],
    longitude: [-84.087502, [Validators.required]],
    pricePerNight: [0, [Validators.required, Validators.min(0.01)]],
    hasWater: [true],
    hasElectricity: [true],
    idProvincia: [0, [Validators.required, Validators.min(1)]],
    idCanton: [0, [Validators.required, Validators.min(1)]],
    idDistrito: [0, [Validators.required, Validators.min(1)]],
    direccionExacta: [''],
  });

  constructor() {
    const { idProvincia, idCanton } = this.form.controls;
    idProvincia.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.patchValue(
          { idCanton: 0, idDistrito: 0 },
          { emitEvent: false },
        );
      });
    idCanton.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.patchValue({ idDistrito: 0 }, { emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    for (const url of this.newImagePreviewUrls) {
      URL.revokeObjectURL(url);
    }
  }

  cantonesForSelected(): UbicacionCatalog['cantones'] {
    const p = this.form.getRawValue().idProvincia;
    return this.catalog?.cantones.filter((c) => c.idProvincia === p) ?? [];
  }

  distritosForSelected(): UbicacionCatalog['distritos'] {
    const k = this.form.getRawValue().idCanton;
    return this.catalog?.distritos.filter((d) => d.idCanton === k) ?? [];
  }

  imageDataUrl(img: CampsiteImageResponse): string {
    return img.imageUrl ?? '';
  }

  isImageKept(id: number): boolean {
    return this.imageIdsToKeep.has(id);
  }

  onKeepExistingImageChange(id: number, checked: boolean): void {
    if (checked) {
      this.imageIdsToKeep.add(id);
    } else {
      this.imageIdsToKeep.delete(id);
    }
  }

  /** Visual feedback while files are dragged over the drop zone. */
  dropZoneActive = false;

  onNewImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length) {
      return;
    }
    this.addNewImageFiles(list);
    input.value = '';
  }

  /** Accepts images from file input or drag-and-drop. */
  addNewImageFiles(files: FileList | File[]): void {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    for (const file of imageFiles) {
      this.newImageFiles.push(file);
      this.newImagePreviewUrls.push(URL.createObjectURL(file));
    }
  }

  onDropZoneDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDropZoneDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dropZoneActive = true;
  }

  onDropZoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const zone = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (next && zone.contains(next)) {
      return;
    }
    this.dropZoneActive = false;
  }

  onDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dropZoneActive = false;
    const list = event.dataTransfer?.files;
    if (!list?.length) {
      return;
    }
    this.addNewImageFiles(list);
  }

  triggerNewImageFileInput(input: HTMLInputElement): void {
    input.click();
  }

  onDropZoneKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  }

  removeNewImageAt(index: number): void {
    const url = this.newImagePreviewUrls[index];
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.newImagePreviewUrls.splice(index, 1);
    this.newImageFiles.splice(index, 1);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      if (!this.authz.hasPermission(PERMISSIONS.CampsiteCreate)) {
        void this.router.navigate([APP_HOME_PATH]);
        return;
      }
      this.campsiteId = null;
    } else {
      if (!this.authz.hasPermission(PERMISSIONS.CampsiteUpdate)) {
        void this.router.navigate([APP_HOME_PATH]);
        return;
      }
    }

    this.locationApi.loadUbicacionCatalog().subscribe({
      next: (cat) => (this.catalog = cat),
    });

    if (idParam === null) {
      return;
    }

    const id = Number(idParam);
    if (Number.isNaN(id)) {
      void this.router.navigate(['/admin/campsites']);
      return;
    }

    this.campsiteId = id;
    this.campsitesApi.getbyId(id).subscribe({
      next: (cs) => {
        if (!cs) {
          this.toast.danger(this.transloco.translate('toast.adminCampsiteNotFound'));
          void this.router.navigate(['/admin/campsites']);
          return;
        }
        this.existingImages = cs.images ?? [];
        this.imageIdsToKeep.clear();
        for (const im of this.existingImages) {
          this.imageIdsToKeep.add(im.id);
        }
        this.form.patchValue({
          name: cs.name,
          description: cs.description,
          latitude: cs.latitude,
          longitude: cs.longitude,
          pricePerNight: cs.pricePerNight,
          hasWater: cs.hasWater,
          hasElectricity: cs.hasElectricity,
          idProvincia: cs.idProvincia,
          idCanton: cs.idCanton,
          idDistrito: cs.idDistrito,
          direccionExacta: cs.direccionExacta ?? '',
        });
      },
      error: () => {
        void this.router.navigate(['/admin/campsites']);
      },
    });
  }

  submit(): void {
    if (!this.canSubmit) {
      void this.router.navigate([APP_HOME_PATH]);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const fields: CampsiteFormFields = {
      name: v.name.trim(),
      description: v.description.trim(),
      latitude: v.latitude,
      longitude: v.longitude,
      pricePerNight: v.pricePerNight,
      hasWater: v.hasWater,
      hasElectricity: v.hasElectricity,
      idProvincia: v.idProvincia,
      idCanton: v.idCanton,
      idDistrito: v.idDistrito,
      direccionExacta: v.direccionExacta.trim() ? v.direccionExacta.trim() : null,
    };

    if (this.campsiteId === null) {
      this.campsitesApi.create(fields, this.newImageFiles).subscribe({
        next: (newId) => {
          if (newId === null) {
            return;
          }
          void this.router.navigate(['/admin/campsites']);
        },
      });
      return;
    }

    const idsToKeep = Array.from(this.imageIdsToKeep);
    this.campsitesApi
      .update(this.campsiteId, fields, idsToKeep, this.newImageFiles)
      .subscribe({
        next: (ok) => {
          if (ok) {
            void this.router.navigate(['/admin/campsites']);
          }
        },
      });
  }
}
