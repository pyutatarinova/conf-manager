import { apiFetch, apiRequest } from './client';

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

export async function listSubmissionFiles(submissionId) {
  return apiRequest(`/submissions/${submissionId}/files`, { method: 'GET' });
}

function tryGetFilenameFromContentDisposition(value) {
  if (!value) return '';
  const header = String(value);

  // RFC 5987: filename*=UTF-8''<urlencoded>
  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const plainMatch = header.match(/filename\s*=\s*\"?([^\";]+)\"?/i);
  return plainMatch?.[1]?.trim() || '';
}

export async function downloadSubmissionFileDirect(submissionId, fileType) {
  const response = await apiFetch(`/submissions/${submissionId}/files/${fileType}/download-direct`, { method: 'GET' });
  const blob = await response.blob();
  const filename = tryGetFilenameFromContentDisposition(response.headers.get('Content-Disposition'));
  return { blob, filename, contentType: response.headers.get('Content-Type') || blob.type || '' };
}

export async function makeSubmissionDecision(submissionId, { decision, comment = null }) {
  return apiRequest(`/submissions/${submissionId}/decision`, {
    method: 'POST',
    body: { decision, comment }
  });
}

export async function listChairMySubmissions() {
  return apiRequest('/submissions/chair/my', { method: 'GET' });
}
