import fs from 'fs';
import path from 'path';

export interface ContactMessage {
  id: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
  ip?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadMessages(): ContactMessage[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read messages database:', err);
  }
  return [];
}

function saveMessages(messages: ContactMessage[]): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write messages database:', err);
  }
}

export const contactStore = {
  getAllMessages(): ContactMessage[] {
    const messages = loadMessages();
    return messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addMessage(
    senderEmail: string,
    message: string,
    subject?: string,
    senderName?: string,
    ip?: string
  ): ContactMessage {
    const cleanEmail = (senderEmail || '').trim().toLowerCase();
    const cleanMsg = (message || '').trim();
    if (!cleanEmail) {
      throw new Error('Valid email address is required.');
    }
    if (!cleanMsg) {
      throw new Error('Message content cannot be empty.');
    }

    const messages = loadMessages();
    const newMessage: ContactMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      senderEmail: cleanEmail,
      senderName: senderName?.trim() || undefined,
      subject: subject?.trim() || 'Website Inquiry / Feedback',
      message: cleanMsg,
      createdAt: new Date().toISOString(),
      status: 'unread',
      ip,
    };

    messages.push(newMessage);
    saveMessages(messages);
    return newMessage;
  },

  markAsRead(id: string): boolean {
    const messages = loadMessages();
    const target = messages.find((m) => m.id === id);
    if (target) {
      target.status = 'read';
      saveMessages(messages);
      return true;
    }
    return false;
  },

  deleteMessage(id: string): boolean {
    let messages = loadMessages();
    const initialLen = messages.length;
    messages = messages.filter((m) => m.id !== id);
    if (messages.length !== initialLen) {
      saveMessages(messages);
      return true;
    }
    return false;
  },

  getUnreadCount(): number {
    const messages = loadMessages();
    return messages.filter((m) => m.status === 'unread').length;
  },
};
