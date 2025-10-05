import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.txt'); // NDJSON lines: {"u":"name","p":"hash"}
const NOTES_DIR = path.join(DATA_DIR, 'notes'); // per-user plain text files

// Ensure data directories exist
await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(NOTES_DIR, { recursive: true });
try { await fs.access(USERS_FILE); } catch { await fs.writeFile(USERS_FILE, '', 'utf8'); }

const app = express();
app.use(express.json({ limit: '1mb' }));

// Static site
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { index: 'index.html' }));

// Helpers
const validUsername = (u) => /^[A-Za-z0-9_\-]{3,32}$/.test(u);
const validPassword = (p) => typeof p === 'string' && p.length >= 6 && p.length <= 128;

async function readUsers() {
  const out = new Map();
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    if (!raw) return out;
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try {
        const obj = JSON.parse(t);
        if (obj && obj.u) out.set(obj.u, obj);
      } catch {}
    }
  } catch {}
  return out;
}

async function appendUser(userObj) {
  await fs.appendFile(USERS_FILE, JSON.stringify(userObj) + '\n', 'utf8');
}

function signToken(username) {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const hdr = req.get('authorization') || '';
  const m = hdr.match(/^Bearer\s+(.+)/i);
  if (!m) return res.status(401).json({ error: 'Unauthorized' });
  const token = m[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = String(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// New ultra-simple note API based on 12-char tocken
const TOCKEN_RE = /^[A-Za-z0-9]{12}$/;
app.get('/api/note/:tocken', async (req, res) => {
  const { tocken } = req.params;
  if (!TOCKEN_RE.test(tocken)) return res.status(400).json({ error: 'invalid tocken' });
  const file = path.join(NOTES_DIR, `${tocken}.txt`);
  try {
    const text = await fs.readFile(file, 'utf8');
    return res.json({ content: text });
  } catch {
    return res.json({ content: '' });
  }
});

app.post('/api/note/:tocken', async (req, res) => {
  const { tocken } = req.params;
  const { content } = req.body || {};
  if (!TOCKEN_RE.test(tocken)) return res.status(400).json({ error: 'invalid tocken' });
  if (typeof content !== 'string') return res.status(400).json({ error: 'content 需为字符串' });
  const file = path.join(NOTES_DIR, `${tocken}.txt`);
  await fs.writeFile(file, content, 'utf8');
  return res.json({ ok: true });
});

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Dynamic route: /:tocken (12 chars) serves main page
app.get('/:tocken([A-Za-z0-9]{12})', (req, res) => {
  return res.sendFile(path.join(publicDir, 'app.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
