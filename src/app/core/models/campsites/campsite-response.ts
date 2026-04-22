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
}