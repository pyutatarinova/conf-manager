import { apiRequest } from './client';

export async function createConference({
  title,
  description = null,
  start_date = null,
  submission_deadline = null,
  is_public = false,
  is_submit = true
}) {
  return apiRequest('/conferences/', {
    method: 'POST',
    body: { title, description, start_date, submission_deadline, is_public, is_submit }
  });
}

export async function listConferences() {
  return apiRequest('/conferences/', { method: 'GET' });
}

export async function getConference(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}`, { method: 'GET' });
}

export async function createInvite(conferenceId, { email, role, section_id = null }) {
  return apiRequest(`/conferences/${conferenceId}/invites`, {
    method: 'POST',
    body: { email, role, section_id }
  });
}

export async function createSection(conferenceId, { name, description = null }) {
  return apiRequest(`/conferences/${conferenceId}/sections`, {
    method: 'POST',
    body: { name, description }
  });
}

export async function listSections(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}/sections`, { method: 'GET' });
}

export async function listParticipants(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}/participants`, { method: 'GET' });
}

export async function listConferenceReviewers(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}/reviewers`, { method: 'GET' });
}

export async function deleteParticipant(conferenceId, inviteId) {
  return apiRequest(`/conferences/${conferenceId}/participants/${inviteId}`, { method: 'DELETE' });
}

export async function getMyConferenceRole(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}/my-role`, { method: 'GET' });
}

export async function listConferenceStaff(conferenceId) {
  return apiRequest(`/conferences/${conferenceId}/staff`, { method: 'GET' });
}

export async function updateSection(conferenceId, sectionId, { name, description }) {
  return apiRequest(`/conferences/${conferenceId}/sections/${sectionId}`, {
    method: 'PUT',
    body: { name, description }
  });
}

export async function deleteSection(conferenceId, sectionId) {
  return apiRequest(`/conferences/${conferenceId}/sections/${sectionId}`, { method: 'DELETE' });
}

export async function updateConference(conferenceId, { title, description, start_date, submission_deadline, is_public, is_submit }) {
  return apiRequest(`/conferences/${conferenceId}`, {
    method: 'PUT',
    body: { title, description, start_date, submission_deadline, is_public, is_submit }
  });
}
