export interface CampsiteReviewResponse {
    id: number;
    userId: number;
    userName: string;
    campsiteId: number;
    rating: number;
    comment: string;
    createdAt: Date;
}