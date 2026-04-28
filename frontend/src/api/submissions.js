import { apiRequest } from './client';

export async function createSubmission({ conference_id, section_id = null, title, file_id }) {
  return apiRequest('/submissions/', {
    method: 'POST',
    body: { conference_id, section_id, title, file_id }
  });
}

export async function listConferenceSubmissions(conferenceId) {
  return apiRequest(`/submissions/conference/${conferenceId}`, { method: 'GET' });
}

