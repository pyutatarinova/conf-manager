import { apiRequest } from './client';

export async function createConference({ title, description = null, submission_deadline = null, is_public = false }) {
  return apiRequest('/conferences/', {
    method: 'POST',
    body: { title, description, submission_deadline, is_public }
  });
}

export async function listConferences() {
  return apiRequest('/conferences/', { method: 'GET' });
}

export async function getConference(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}`, { method: 'GET' });
}

export async function createInvite(conferenceId, { email, role }) {
  return apiRequest(`/conferences/${conferenceId}/invites`, {
    method: 'POST',
    body: { email, role }
  });
}
