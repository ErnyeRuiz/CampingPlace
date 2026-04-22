export interface CampsiteReviewResponse {
    id: number;
    userId: number;
    campsiteId: number;
    rating: number;
    comment: string;
    createdAt: Date;
}