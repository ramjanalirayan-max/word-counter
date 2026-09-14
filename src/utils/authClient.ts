import { UserProfile, AdminStats, ContactMessage } from '../types';

const USER_STORAGE_KEY = 'accent_studio_user_session';
const ADMIN_STORAGE_KEY = 'accent_studio_admin_session';

export interface AdminSession {
  token: string;
  email: string;
  name: string;
}

export const authClient = {
  // Get currently logged-in user from localStorage
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
    return null;
  },

  // Save user session
  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      // Ping visit
      this.recordVisit(user.email);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  // Get Admin session
  getAdminSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse admin session:', e);
    }
    return null;
  },

  setAdminSession(session: AdminSession | null) {
    if (session) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  },

  // Register with email and password
  async registerEmail(email: string, password: string, name?: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to register account');
    }
    this.setCurrentUser(data.user);
    return data.user;
  },

  // Login with email and password
  async loginEmail(email: string, password: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid email or password');
    }
    this.setCurrentUser(data.user);
    return data.user;
  },

  // One-click login with Google / Gmail
  async loginGoogle(email: string, name?: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Google login failed');
    }
    this.setCurrentUser(data.user);
    return data.user;
  },

  // Record visit
  async recordVisit(email: string) {
    try {
      await fetch('/api/auth/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Non-blocking
    }
  },

  // Admin login
  async loginAdmin(email: string, password: string): Promise<AdminSession> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Unauthorized admin credentials');
    }
    const session: AdminSession = {
      token: data.token,
      email: data.email,
      name: data.name,
    };
    this.setAdminSession(session);
    return session;
  },

  // Fetch admin user list
  async getAdminUsers(token: string): Promise<{ users: UserProfile[]; stats: AdminStats }> {
    const res = await fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch user list');
    }
    return { users: data.users, stats: data.stats };
  },

  // Delete user by id (admin only)
  async deleteUser(token: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return !!data.success;
  },

  // Send contact/problem message to admin
  async sendContactMessage(
    senderEmail: string,
    message: string,
    subject?: string,
    senderName?: string
  ): Promise<{ success: boolean; message: string; id: string }> {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail, message, subject, senderName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit message to admin.');
    }
    return data;
  },

  // Get contact messages for admin
  async getAdminMessages(token: string): Promise<{ messages: ContactMessage[]; unreadCount: number }> {
    const res = await fetch('/api/admin/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch admin messages.');
    }
    return { messages: data.messages, unreadCount: data.unreadCount };
  },

  // Mark message as read
  async markMessageAsRead(token: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/messages/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return !!data.success;
  },

  // Delete message (admin only)
  async deleteAdminMessage(token: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return !!data.success;
  },

  logoutUser() {
    this.setCurrentUser(null);
  },

  logoutAdmin() {
    this.setAdminSession(null);
  },
};
