import { apiRequest } from './client';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/files/upload', {
    method: 'POST',
    body: formData
  });
}

