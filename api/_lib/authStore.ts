import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// ----------------- Supabase Client & Persistence -----------------

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * Automatically inserts or upserts a user record into the Supabase `users` table.
 * Handles resilience if table only supports minimal fields (id, email, name, created_at)
 * or if it supports full audit columns.
 */
export async function upsertSupabaseUser(user: UserRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  const cleanEmail = user.email.toLowerCase().trim();
  const cleanName = user.name?.trim() || cleanEmail.split('@')[0];
  const now = new Date().toISOString();

  try {
    // 1. First attempt: Full schema with standard Supabase snake_case columns
    const fullPayload: Record<string, any> = {
      id: user.id,
      email: cleanEmail,
      name: cleanName,
      provider: user.provider || 'email',
      created_at: user.createdAt || now,
      last_visit_at: user.lastVisitAt || now,
      visit_count: user.visitCount || 1,
      last_ip: user.lastIp || null,
    };

    if (user.password) {
      fullPayload.password = user.password;
    }

    const { error: fullError } = await supabase
      .from('users')
      .upsert(fullPayload, { onConflict: 'email' });

    if (!fullError) {
      return;
    }

    console.warn('Supabase full upsert warning, retrying with core fields (id, email, name, created_at):', fullError.message);

    // 2. Fallback attempt: Core fields (id, email, name, created_at)
    const corePayload = {
      id: user.id,
      email: cleanEmail,
      name: cleanName,
      created_at: user.createdAt || now,
    };

    const { error: coreError } = await supabase
      .from('users')
      .upsert(corePayload, { onConflict: 'email' });

    if (coreError) {
      console.error('Supabase core upsert also failed:', coreError.message);
    }
  } catch (err: any) {
    console.error('Unexpected error during Supabase user upsert:', err?.message || err);
  }
}

/**
 * Queries and returns all registered user records directly from the Supabase `users` table.
 * Falls back to local in-memory or file storage if Supabase is unconfigured or fails.
 */
export async function getSupabaseUsers(): Promise<Omit<UserRecord, 'password'>[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return authStore.getAllUsers();
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.warn('Supabase getSupabaseUsers error, falling back to local storage:', error.message);
      return authStore.getAllUsers();
    }

    if (!data || data.length === 0) {
      // If table is empty, check local users
      const local = authStore.getAllUsers();
      return local;
    }

    // Map fields safely (supporting both snake_case and camelCase database columns)
    const users: Omit<UserRecord, 'password'>[] = data.map((row: any) => {
      const email = String(row.email || '').toLowerCase().trim();
      const name = String(row.name || email.split('@')[0] || 'User');
      const id = String(row.id || 'usr_' + Math.random().toString(36).substring(2, 9));
      const provider = (row.provider === 'google' ? 'google' : 'email') as 'google' | 'email';
      const createdAt = row.created_at || row.createdAt || new Date().toISOString();
      const lastVisitAt = row.last_visit_at || row.lastVisitAt || createdAt;
      const visitCount = Number(row.visit_count || row.visitCount || 1);
      const lastIp = row.last_ip || row.lastIp || undefined;

      return {
        id,
        email,
        name,
        provider,
        createdAt,
        lastVisitAt,
        visitCount,
        lastIp,
      };
    });

    // Sort descending by last visit / created date
    users.sort((a, b) => new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime());

    // Merge into local cache so in-memory store remains in sync
    for (const u of users) {
      const existing = inMemoryUsers.find((local) => local.email === u.email);
      if (!existing) {
        inMemoryUsers.push({
          ...u,
        });
      } else {
        existing.lastVisitAt = u.lastVisitAt;
        existing.visitCount = Math.max(existing.visitCount, u.visitCount);
      }
    }

    return users;
  } catch (err: any) {
    console.error('Error fetching users from Supabase:', err?.message || err);
    return authStore.getAllUsers();
  }
}

/**
 * Deletes a user by ID from Supabase if connected
 */
export async function deleteSupabaseUser(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ----------------- Local Storage & Fallback System -----------------

// Ensure data directory works in both standard servers and serverless environments (Vercel/Lambda)
let DATA_DIR = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  DATA_DIR = path.join('/tmp', 'data');
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // In-memory fallback
  }
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
let inMemoryUsers: UserRecord[] = [];

// Initial sample or storage loader
function loadUsers(): UserRecord[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      inMemoryUsers = JSON.parse(raw);
      return inMemoryUsers;
    }
  } catch (err) {
    console.error('Failed to read users database, using in-memory store:', err);
  }
  return inMemoryUsers;
}

function saveUsers(users: UserRecord[]): void {
  inMemoryUsers = users;
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist users to disk (running in ephemeral serverless environment):', err);
  }
}

export const ADMIN_CONFIG = {
  email: (process.env.ADMIN_EMAIL || 'ramjanalirayan@gmail.com').toLowerCase().trim(),
  password: (process.env.ADMIN_PASSWORD || 'Rayan892').trim(),
};

export const authStore = {
  getAllUsers(): Omit<UserRecord, 'password'>[] {
    const users = loadUsers();
    return users
      .map(({ password, ...rest }) => rest)
      .sort((a, b) => new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime());
  },

  findUserByEmail(email: string): UserRecord | undefined {
    const users = loadUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  async registerEmailUser(
    email: string,
    password: string,
    name?: string,
    ip?: string
  ): Promise<Omit<UserRecord, 'password'>> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();

    // Check in local cache
    const existingLocal = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingLocal) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Check in Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: existingRemote } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingRemote) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
      } catch (err: any) {
        if (err?.message?.includes('already exists')) throw err;
      }
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

    // Persist to Supabase asynchronously
    await upsertSupabaseUser(newUser);

    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  async loginEmailUser(
    email: string,
    password: string,
    ip?: string
  ): Promise<Omit<UserRecord, 'password'>> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();

    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // If not found in local cache, query Supabase
    if (!user) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: remoteUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (remoteUser) {
            user = {
              id: remoteUser.id || 'usr_' + Date.now(),
              email: cleanEmail,
              name: remoteUser.name || cleanEmail.split('@')[0],
              password: remoteUser.password,
              provider: (remoteUser.provider === 'google' ? 'google' : 'email'),
              createdAt: remoteUser.created_at || new Date().toISOString(),
              lastVisitAt: new Date().toISOString(),
              visitCount: Number(remoteUser.visit_count || 1),
              lastIp: ip,
            };
            users.push(user);
          }
        } catch (err) {
          console.warn('Error checking Supabase during login:', err);
        }
      }
    }

    if (!user) {
      throw new Error('No account found with this email. Please sign up first.');
    }

    if (user.provider === 'email' && user.password && user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    user.lastVisitAt = new Date().toISOString();
    user.visitCount = (user.visitCount || 0) + 1;
    if (ip) user.lastIp = ip;
    saveUsers(users);

    // Update Supabase
    await upsertSupabaseUser(user);

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async loginGoogleUser(
    email: string,
    name?: string,
    ip?: string
  ): Promise<Omit<UserRecord, 'password'>> {
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
      // Check Supabase
      const supabase = getSupabase();
      let remoteUser: any = null;
      if (supabase) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();
          remoteUser = data;
        } catch (e) {
          console.warn('Error querying Supabase for Google login:', e);
        }
      }

      if (remoteUser) {
        user = {
          id: remoteUser.id || 'usr_' + Math.random().toString(36).substring(2, 10),
          email: cleanEmail,
          name: name || remoteUser.name || cleanEmail.split('@')[0],
          provider: 'google',
          createdAt: remoteUser.created_at || now,
          lastVisitAt: now,
          visitCount: Number(remoteUser.visit_count || 0) + 1,
          lastIp: ip,
        };
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
      }
      users.push(user);
    }

    saveUsers(users);

    // Persist to Supabase
    await upsertSupabaseUser(user);

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async recordVisit(email: string, ip?: string): Promise<void> {
    const users = loadUsers();
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.lastVisitAt = new Date().toISOString();
      user.visitCount = (user.visitCount || 0) + 1;
      if (ip) user.lastIp = ip;
      saveUsers(users);
      await upsertSupabaseUser(user);
    }
  },

  verifyAdmin(email: string, pass: string): boolean {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (pass || '').trim();
    return cleanEmail === ADMIN_CONFIG.email && cleanPass === ADMIN_CONFIG.password;
  },

  async deleteUser(id: string): Promise<boolean> {
    let users = loadUsers();
    const initialLen = users.length;
    users = users.filter((u) => u.id !== id);
    const deletedLocally = users.length !== initialLen;
    if (deletedLocally) {
      saveUsers(users);
    }
    const deletedRemotely = await deleteSupabaseUser(id);
    return deletedLocally || deletedRemotely;
  },

  async getStats() {
    // Attempt to compute stats from Supabase users
    const users = await getSupabaseUsers();
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

export default authStore;
