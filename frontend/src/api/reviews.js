import { apiRequest } from './client';

export async function assignReviewer({ submission_id, reviewer_id }) {
  return apiRequest('/reviews/assign', {
    method: 'POST',
    body: { submission_id, reviewer_id }
  });
}

export async function listMyReviewSubmissions() {
  return apiRequest('/reviews/my-submissions', { method: 'GET' });
}
