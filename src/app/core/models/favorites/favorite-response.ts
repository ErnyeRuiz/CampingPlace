import { CampsiteSummary } from '../campsites/campsite-summary';

export interface FavoriteResponse {
  id: number;
  userId: number;
  campSiteId: number;
  campSiteSummary: CampsiteSummary | null;
}
