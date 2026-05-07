/** Scalar fields for campsite create/update (sent inside multipart/form-data). */
export interface CampsiteFormFields {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  hasWater: boolean;
  hasElectricity: boolean;
  idProvincia: number;
  idCanton: number;
  idDistrito: number;
  direccionExacta: string | null;
}
