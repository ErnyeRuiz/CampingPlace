export interface CampsiteSummary {
  id: number;
  name: string;
  description: string;
  pricePerNight: number;
  idProvincia: number;
  idCanton: number;
  idDistrito: number;
  image: string | null;
}
