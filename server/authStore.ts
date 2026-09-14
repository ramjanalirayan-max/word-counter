import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password?: string;
  provider: 'google' | 'email';
  createdAt: string;
  lastVisitAt: string;
  visitCount: number;
  lastIp?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample or empty storage
function loadUsers(): UserRecord[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read users database, resetting to fallback:', err);
  }
  return [];
}

function saveUsers(users: UserRecord[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write users database:', err);
  }
}

export const ADMIN_CONFIG = {
  email: (process.env.ADMIN_EMAIL || 'ramjanalirayan@gmail.com').toLowerCase().trim(),
  password: (process.env.ADMIN_PASSWORD || 'Rayan892').trim(),
};

export const authStore = {
  getAllUsers(): Omit<UserRecord, 'password'>[] {
    const users = loadUsers();
    // Return sorted by lastVisitAt descending
    return users
      .map(({ password, ...rest }) => rest)
      .sort((a, b) => new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime());
  },

  findUserByEmail(email: string): UserRecord | undefined {
    const users = loadUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  registerEmailUser(email: string, password: string, name?: string, ip?: string): Omit<UserRecord, 'password'> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      password,
      provider: 'email',
      createdAt: now,
      lastVisitAt: now,
      visitCount: 1,
      lastIp: ip,
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  loginEmailUser(email: string, password: string, ip?: string): Omit<UserRecord, 'password'> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();

    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('No account found with this email. Please sign up first.');
    }

    if (user.provider === 'email' && user.password && user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    // Update last visit and visit count
    user.lastVisitAt = new Date().toISOString();
    user.visitCount = (user.visitCount || 0) + 1;
    if (ip) user.lastIp = ip;
    saveUsers(users);

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  loginGoogleUser(email: string, name?: string, ip?: string): Omit<UserRecord, 'password'> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.lastVisitAt = now;
      user.visitCount = (user.visitCount || 0) + 1;
      if (name && !user.name) user.name = name;
      if (ip) user.lastIp = ip;
    } else {
      user = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        provider: 'google',
        createdAt: now,
        lastVisitAt: now,
        visitCount: 1,
        lastIp: ip,
      };
      users.push(user);
    }

    saveUsers(users);

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  recordVisit(email: string, ip?: string): void {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.lastVisitAt = new Date().toISOString();
      user.visitCount = (user.visitCount || 0) + 1;
      if (ip) user.lastIp = ip;
      saveUsers(users);
    }
  },

  verifyAdmin(email: string, pass: string): boolean {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (pass || '').trim();
    return cleanEmail === ADMIN_CONFIG.email && cleanPass === ADMIN_CONFIG.password;
  },

  deleteUser(id: string): boolean {
    let users = loadUsers();
    const initialLen = users.length;
    users = users.filter((u) => u.id !== id);
    if (users.length !== initialLen) {
      saveUsers(users);
      return true;
    }
    return false;
  },

  getStats() {
    const users = loadUsers();
    const totalUsers = users.length;
    const googleUsers = users.filter((u) => u.provider === 'google').length;
    const emailUsers = users.filter((u) => u.provider === 'email').length;
    const totalVisits = users.reduce((acc, u) => acc + (u.visitCount || 1), 0);

    const lastActive = users
      .slice()
      .sort((a, b) => new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime())[0];

    return {
      totalUsers,
      googleUsers,
      emailUsers,
      totalVisits,
      lastActiveEmail: lastActive?.email || null,
      lastActiveTime: lastActive?.lastVisitAt || null,
    };
  },
};
