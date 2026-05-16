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

export async function createReview({ submission_id, decision, comments, file_id = null }) {
  return apiRequest('/reviews/', {
    method: 'POST',
    body: { submission_id, decision, comments, file_id }
  });
}

export async function listMyReviews() {
  return apiRequest('/reviews/my', { method: 'GET' });
}

export async function listSubmissionReviews(submissionId) {
  return apiRequest(`/reviews/submission/${submissionId}`, { method: 'GET' });
}

