/**
 * Call Quality Review Tool — Server Entry Point
 * 
 * Express app that serves the REST API and static frontend.
 */

const express = require('express');
const path = require('path');

const callsRouter = require('./src/routes/calls');

const fs = require('fs');

// Load local .env manually if it exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.warn('Failed to load local .env config:', e.message);
}

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/calls', callsRouter);

// --- Catch-all: serve index.html for SPA ---
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`\n  🎧  Call Quality Review Tool`);
  console.log(`  ───────────────────────────`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/calls`);
  console.log(`  Groq AI: enabled\n`);
});
