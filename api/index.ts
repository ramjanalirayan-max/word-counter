import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { authStore, ADMIN_CONFIG } from './authStore.js';
import { contactStore } from './contactStore.js';

dotenv.config();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to safely extract JSON body (supports Vercel pre-parsed or unparsed body)
const parseBody = (req: express.Request) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const router = express.Router();

// Health endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node',
    time: new Date().toISOString(),
  });
});

// Gemini TTS handler
const handleTts = async (req: express.Request, res: express.Response) => {
  try {
    const body = parseBody(req);
    const { text, accent = 'british', gender = 'female', wordPauseMs = 0 } = body;

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

    // Voice mapping based on Gender
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

router.post('/tts/gemini', handleTts);
router.post('/synthesize', handleTts);

// ----------------- Authentication Endpoints -----------------

// Register with Email & Password
router.post('/auth/register', (req, res) => {
  try {
    const body = parseBody(req);
    const { email, password, name } = body;
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
router.post('/auth/login', (req, res) => {
  try {
    const body = parseBody(req);
    const { email, password } = body;
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
router.post('/auth/google', (req, res) => {
  try {
    const body = parseBody(req);
    const { email, name } = body;
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
router.post('/auth/visit', (req, res) => {
  try {
    const body = parseBody(req);
    const { email } = body;
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
router.post('/admin/login', (req, res) => {
  try {
    const body = parseBody(req);
    const { email, password } = body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Admin Gmail and password are required.' });
    }

    const isValid = authStore.verifyAdmin(email, password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Admin credentials. Access denied. Only authorized studio administrator can log in.',
      });
    }

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
router.get('/admin/users', requireAdmin, (req, res) => {
  try {
    const users = authStore.getAllUsers();
    const stats = authStore.getStats();
    return res.json({ success: true, users, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch users.' });
  }
});

// Admin get overview stats
router.get('/admin/stats', requireAdmin, (req, res) => {
  try {
    const stats = authStore.getStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch stats.' });
  }
});

// Admin delete a user
router.delete('/admin/users/:id', requireAdmin, (req, res) => {
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
router.post('/contact', (req, res) => {
  try {
    const body = parseBody(req);
    const { senderEmail, message, subject, senderName } = body;
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
router.get('/admin/messages', requireAdmin, (req, res) => {
  try {
    const messages = contactStore.getAllMessages();
    const unreadCount = contactStore.getUnreadCount();
    return res.json({ success: true, messages, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve messages.' });
  }
});

// Admin endpoint: Mark message as read
router.patch('/admin/messages/:id/read', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const ok = contactStore.markAsRead(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update message.' });
  }
});

// Admin endpoint: Delete contact message
router.delete('/admin/messages/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const ok = contactStore.deleteMessage(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete message.' });
  }
});

// Mount router on both /api (when called directly in local dev or standard express)
// AND on / (when Vercel rewrites /api/(.*) to /api/index.ts)
app.use('/api', router);
app.use('/', router);

export default app;
export { app };
