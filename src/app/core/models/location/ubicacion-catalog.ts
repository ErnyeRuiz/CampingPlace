import { CantonResponse } from './canton-response';
import { DistritoResponse } from './distrito-response';
import { ProvinciaResponse } from './provincia-response';

export interface UbicacionCatalog {
  provincias: ProvinciaResponse[];
  cantones: CantonResponse[];
  distritos: DistritoResponse[];
}
