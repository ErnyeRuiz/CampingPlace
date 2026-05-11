import { CampsiteSummary } from '../campsites/campsite-summary';

export interface TripResponse {
  id: number;
  userId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  campSiteSummaries: CampsiteSummary[];
}
