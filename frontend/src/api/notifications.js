import { apiRequest } from './client';

export async function sendEmail({ to, subject, text }) {
  return apiRequest('/notifications/email', {
    method: 'POST',
    body: { to, subject, text }
  });
}

