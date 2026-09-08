import api from './api';
import type { AuthTokens, User, BusinessProfile } from '../types';

export const authService = {
  async register(data: { email: string; name: string; phone?: string; password: string; password2: string }): Promise<AuthTokens & { message: string }> {
    const res = await api.post('/auth/register/', data);
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const res = await api.post('/auth/login/', { email, password });
    return res.data;
  },

  async googleAuth(token: string): Promise<AuthTokens> {
    const res = await api.post('/auth/google/', { token });
    return res.data;
  },

  async logout(refresh?: string): Promise<void> {
    await api.post('/auth/logout/', { refresh });
  },

  async getProfile(): Promise<User> {
    const res = await api.get('/auth/profile/');
    return res.data;
  },

  async updateProfile(data: Partial<Pick<User, 'name' | 'phone'>>): Promise<User> {
    const res = await api.patch('/auth/profile/', data);
    return res.data;
  },

  async changePassword(old_password: string, new_password: string): Promise<void> {
    await api.post('/auth/change-password/', { old_password, new_password });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/auth/password-reset/', { email });
  },

  async confirmPasswordReset(uid: string, token: string, new_password: string): Promise<void> {
    await api.post('/auth/password-reset-confirm/', { uid, token, new_password });
  },

  async getBusinessProfile(): Promise<BusinessProfile> {
    const res = await api.get('/business/profile/');
    return res.data;
  },

  async updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const res = await api.patch('/business/profile/', data);
    return res.data;
  },
};
