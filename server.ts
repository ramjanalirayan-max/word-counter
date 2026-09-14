import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { authStore, ADMIN_CONFIG } from './server/authStore';
import { contactStore } from './server/contactStore';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini TTS handler
const handleTts = async (req: express.Request, res: express.Response) => {
  try {
    const { text, accent = 'british', gender = 'female', wordPauseMs = 0 } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured. Browser native high-precision accent engine is active.',
        fallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Determine voice name and persona prompt based on Accent and Gender
    let voiceName = 'Kore'; // Female
    if (gender === 'male') {
      voiceName = 'Puck'; // Male
    }

    const accentGuide =
      accent === 'australian'
        ? 'Speak with an authentic Australian accent (Strine/General Australian tone, natural Aussie vowels).'
        : 'Speak with an authentic British accent (Received Pronunciation / BBC English, crisp and refined).';

    let prompt = `${accentGuide} ${gender === 'male' ? 'Male voice.' : 'Female voice.'} `;
    
    if (wordPauseMs > 0) {
      const pauseSec = (wordPauseMs / 1000).toFixed(2);
      prompt += `Important: Speak word-by-word with a distinct ${pauseSec} second pause between each individual word. Text to speak: ${text}`;
    } else {
      prompt += `Text to speak: ${text}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

    if (!base64Audio) {
      return res.status(500).json({
        error: 'No audio returned from Gemini model',
        fallback: true,
      });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType,
      sampleRate: 24000,
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Gemini TTS error:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate speech with Gemini',
      fallback: true,
    });
  }
};

app.post('/api/tts/gemini', handleTts);
app.post('/api/synthesize', handleTts);

// ----------------- Authentication Endpoints -----------------

// Register with Email & Password
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const user = authStore.registerEmailUser(email, password, name, ip);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Login with Email & Password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const user = authStore.loginEmailUser(email, password, ip);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Login failed.' });
  }
});

// Google / Gmail one-click login
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email address is required.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const user = authStore.loginGoogleUser(email, name, ip);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Google login failed.' });
  }
});

// Track last visit timestamp
app.post('/api/auth/visit', (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      authStore.recordVisit(email, ip);
    }
    return res.json({ success: true });
  } catch {
    return res.json({ success: false });
  }
});

// ----------------- Admin Panel Endpoints -----------------

// Admin login verification
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Admin Gmail and password are required.' });
    }

    const isValid = authStore.verifyAdmin(email, password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Admin credentials. Access denied. Only authorized studio administrator can log in.',
      });
    }

    // Generate simple deterministic token
    const token = 'admin_session_' + Buffer.from(ADMIN_CONFIG.email + ':' + Date.now()).toString('base64');
    return res.json({
      success: true,
      token,
      email: ADMIN_CONFIG.email,
      name: 'Ramjan Ali (Admin)',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin login failed.' });
  }
});

// Middleware to verify admin token/header
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer admin_session_')) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
};

// Admin get all registered users with last visit info
app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const users = authStore.getAllUsers();
    const stats = authStore.getStats();
    return res.json({ success: true, users, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch users.' });
  }
});

// Admin get overview stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  try {
    const stats = authStore.getStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch stats.' });
  }
});

// Admin delete a user
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = authStore.deleteUser(id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete user.' });
  }
});

// ----------------- Contact Admin Endpoints -----------------

// Public endpoint: Submit feedback / message to admin
app.post('/api/contact', (req, res) => {
  try {
    const { senderEmail, message, subject, senderName } = req.body;
    if (!senderEmail || !message) {
      return res.status(400).json({ error: 'Email and message content are required.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const saved = contactStore.addMessage(senderEmail, message, subject, senderName, ip);
    return res.json({
      success: true,
      message: 'Your message has been received by Admin Ramjan Ali.',
      id: saved.id,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to send message.' });
  }
});

// Admin endpoint: List all contact messages
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  try {
    const messages = contactStore.getAllMessages();
    const unreadCount = contactStore.getUnreadCount();
    return res.json({ success: true, messages, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve messages.' });
  }
});

// Admin endpoint: Mark message as read
app.patch('/api/admin/messages/:id/read', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const ok = contactStore.markAsRead(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update message.' });
  }
});

// Admin endpoint: Delete contact message
app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const ok = contactStore.deleteMessage(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete message.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
