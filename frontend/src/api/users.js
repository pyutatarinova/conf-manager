import { apiRequest } from './client';

export async function getMe() {
  return apiRequest('/auth/me', { method: 'GET' });
}

