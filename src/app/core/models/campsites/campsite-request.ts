export class CampsiteRequest {
    constructor(
        public name: string,
        public description: string,
        public latitude: number,
        public longitude: number,
        public pricePerNight: number,
        public hasWater: boolean,
        public hasElectricity: boolean
    ){}
}