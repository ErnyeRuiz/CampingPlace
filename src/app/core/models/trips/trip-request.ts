/** Body for create/update trip; dates as yyyy-MM-dd for API DateOnly. */
export class TripRequest {
    constructor(
        public name: string,
        public startDate: string,
        public endDate: string,
    ) {}
}