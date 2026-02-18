import api from './api';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const loginApi = async (username: string, password: string): Promise<LoginResponse> => {
  // 1. Use URLSearchParams to force application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grant_type', 'password'); // Required by your API spec
  params.append('username', username);
  params.append('password', password);

  const response = await api.post<LoginResponse>('/api/v1/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};