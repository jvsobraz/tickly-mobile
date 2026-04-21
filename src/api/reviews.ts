import { api } from './client';

export interface Review {
  id: number; userId: number; userName: string; rating: number;
  comment?: string; createdAt: string;
}
export interface ReviewSummary {
  averageRating: number; totalReviews: number;
  ratingDistribution: Record<number, number>; reviews: Review[];
}

export const reviewsApi = {
  getByEvent: (eventId: number) =>
    api.get<ReviewSummary>(`/events/${eventId}/reviews`).then(r => r.data),
  create: (eventId: number, rating: number, comment?: string) =>
    api.post<Review>(`/events/${eventId}/reviews`, { rating, comment }).then(r => r.data),
};
