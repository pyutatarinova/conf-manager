import { apiRequest } from './client';

export async function createSubmission({ conference_id, section_id, title, article_file_id, abstract_file_id, affiliation = null }) {
  return apiRequest('/submissions/', {
    method: 'POST',
    body: { conference_id, section_id, title, article_file_id, abstract_file_id, affiliation }
  });
}

export async function listConferenceSubmissions(conferenceId) {
  return apiRequest(`/submissions/conference/${conferenceId}`, { method: 'GET' });
}

export async function listSubmissionAuthors(submissionId) {
  return apiRequest(`/submissions/${submissionId}/authors`, { method: 'GET' });
}

export async function addSubmissionAuthor(submissionId, { name, email, affiliation = null, author_order, is_corresponding = false }) {
  return apiRequest(`/submissions/${submissionId}/authors`, {
    method: 'POST',
    body: { name, email, affiliation, author_order, is_corresponding }
  });
}
