import { apiRequest, setAccessToken } from './client';

export async function login({ email, password }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  const token = data?.access_token;
  if (!token) throw new Error('No access token received');

  setAccessToken(token);
  return token;
}

export async function register({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });
}

export async function registerInvite({ name, password, token }) {
  const data = await apiRequest('/auth/register-invite', {
    method: 'POST',
    body: { name, password, token }
  });

  const accessToken = data?.access_token;
  if (accessToken) setAccessToken(accessToken);
  return data;
}
