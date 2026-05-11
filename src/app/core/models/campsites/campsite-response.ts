import { CampsiteImageResponse } from "./campsite-image-response";

export interface CampsiteResponse {
    id: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    hasWater: boolean;
    hasElectricity: boolean;
    createdByUserId: number;
    createdAt: Date;
    rating: number;
    idProvincia: number;
    idCanton: number;
    idDistrito: number;
    direccionExacta: string;
    images: CampsiteImageResponse[];
}