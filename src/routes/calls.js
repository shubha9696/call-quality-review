/**
 * API Routes — /calls
 * 
 * POST /calls              — Ingest JSON transcript
 * POST /calls/upload       — Upload audio file → Whisper transcription → analysis
 * GET  /calls              — List all calls (filterable by ?agent=)
 * GET  /calls/:id          — Full annotated call with moments + summary
 * GET  /calls/:id/moments  — Just the moments list for a call
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const storage = require('../storage');
const { detectMoments } = require('../detection');
const { computeSummary } = require('../summary');
const { generateAIInsights, processAudioFile } = require('../groqAI');

// --- Multer config for audio uploads ---
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (Groq Whisper limit)
  fileFilter: (req, file, cb) => {
    const allowed = [
      '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a',
      '.wav', '.webm', '.ogg', '.flac',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${ext}. Supported: ${allowed.join(', ')}`));
    }
  },
});

/**
 * POST /calls
 * Ingest a JSON transcript, run detection + summary, store the call.
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body && typeof body === 'object') {
      // Normalize fields if alternative keys are provided (e.g. callId, turns)
      if (!body.id && body.callId) {
        body.id = String(body.callId);
      }
      if (!body.transcript && body.turns) {
        body.transcript = body.turns;
      }
    }

    // Validate required fields
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }
    if (!body.id || typeof body.id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "id" field.' });
    }
    if (!body.agentName || typeof body.agentName !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "agentName" field.' });
    }
    if (!Array.isArray(body.transcript)) {
      return res.status(400).json({ error: 'Missing or invalid "transcript" array.' });
    }

    // Validate each turn in the transcript
    for (let i = 0; i < body.transcript.length; i++) {
      const turn = body.transcript[i];
      if (!turn || typeof turn !== 'object') {
        return res.status(400).json({
          error: `Invalid turn structure at index ${i}. Must be a valid JSON object.`,
        });
      }
      if (!turn.speaker || !['agent', 'customer'].includes(turn.speaker)) {
        return res.status(400).json({
          error: `Invalid speaker at turn ${i}. Must be "agent" or "customer".`,
        });
      }
      if (typeof turn.text !== 'string') {
        return res.status(400).json({ error: `Invalid text at turn ${i}.` });
      }
      if (typeof turn.t !== 'number' || turn.t < 0) {
        return res.status(400).json({ error: `Invalid timestamp at turn ${i}.` });
      }
    }

    // Run moment detection
    const moments = detectMoments(body.transcript);

    // Compute summary
    const summary = computeSummary(body.transcript, moments);

    // Generate AI insights via Groq
    const aiInsights = await generateAIInsights(body.transcript, moments, summary);

    // Build the call object
    const call = {
      id: body.id,
      agentName: body.agentName,
      timestamp: body.timestamp || new Date().toISOString(),
      duration: body.duration || 0,
      transcript: body.transcript,
      moments,
      summary,
      aiInsights,
      source: 'json',
    };

    // Store
    storage.saveCall(call);

    // Return response
    res.status(201).json({
      callId: call.id,
      momentCount: moments.length,
    });
  } catch (err) {
    console.error('POST /calls error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /calls/upload
 * Upload an audio file → transcribe with Groq Whisper → diarize → detect moments → store.
 */
router.post('/upload', upload.single('audio'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded. Use field name "audio".' });
    }

    filePath = req.file.path;
    const agentName = req.body.agentName || 'Unknown Agent';
    const callId = req.body.id || `call_${Date.now()}`;

    console.log(`\n  🎤 Processing audio upload: ${req.file.originalname}`);
    console.log(`  📁 File: ${filePath} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Step 1: Transcribe + diarize with Groq
    const { transcript, duration, rawText } = await processAudioFile(filePath, agentName);

    if (transcript.length === 0) {
      return res.status(400).json({ error: 'No speech could be detected in the audio file.' });
    }

    // Step 2: Run moment detection
    const moments = detectMoments(transcript);

    // Step 3: Compute summary
    const summary = computeSummary(transcript, moments);

    // Step 4: Generate AI insights
    const aiInsights = await generateAIInsights(transcript, moments, summary);

    // Step 5: Build and store the call
    const call = {
      id: callId,
      agentName,
      timestamp: new Date().toISOString(),
      duration,
      transcript,
      moments,
      summary,
      aiInsights,
      source: 'audio',
      audioFileName: req.file.originalname,
      rawTranscription: rawText,
    };

    storage.saveCall(call);

    console.log(`  ✅ Audio call "${callId}" processed: ${moments.length} moments detected\n`);

    res.status(201).json({
      callId: call.id,
      momentCount: moments.length,
      turnCount: transcript.length,
      duration,
      source: 'audio',
    });
  } catch (err) {
    console.error('POST /calls/upload error:', err);
    res.status(500).json({ error: err.message || 'Audio processing failed.' });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
});

/**
 * GET /calls
 * List all calls. Optional query param ?agent= to filter by agent name.
 */
router.get('/', (req, res) => {
  try {
    let calls = storage.getAllCalls();

    // Filter by agent name if provided
    const agentFilter = req.query.agent;
    if (agentFilter) {
      calls = calls.filter(
        c => c.agentName.toLowerCase().includes(agentFilter.toLowerCase())
      );
    }

    // Return a summary view (not full transcripts)
    const result = calls.map(c => ({
      id: c.id,
      agentName: c.agentName,
      timestamp: c.timestamp,
      duration: c.duration,
      momentCount: c.moments.length,
      empathyScore: c.summary.empathyScore,
      sentimentArc: c.summary.sentimentArc,
      source: c.source || 'json',
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /calls error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /calls/:id
 * Return full annotated call — each turn tagged with its moments + summary.
 */
router.get('/:id', (req, res) => {
  try {
    const call = storage.getCall(req.params.id);
    if (!call) {
      return res.status(404).json({ error: `Call "${req.params.id}" not found.` });
    }

    // Annotate each turn with its moments
    const annotatedTranscript = call.transcript.map((turn, index) => ({
      ...turn,
      turnIndex: index,
      moments: call.moments.filter(m => m.turnIndex === index),
    }));

    res.json({
      id: call.id,
      agentName: call.agentName,
      timestamp: call.timestamp,
      duration: call.duration,
      transcript: annotatedTranscript,
      moments: call.moments,
      summary: call.summary,
      aiInsights: call.aiInsights,
      source: call.source || 'json',
      audioFileName: call.audioFileName,
    });
  } catch (err) {
    console.error('GET /calls/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /calls/:id/moments
 * Return only the moments list for a call — for the sidebar panel.
 */
router.get('/:id/moments', (req, res) => {
  try {
    const call = storage.getCall(req.params.id);
    if (!call) {
      return res.status(404).json({ error: `Call "${req.params.id}" not found.` });
    }

    res.json(call.moments);
  } catch (err) {
    console.error('GET /calls/:id/moments error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /calls/:id
 * Delete a call recording and its analysis.
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = storage.deleteCall(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `Call "${req.params.id}" not found.` });
    }
    res.json({ success: true, message: `Call "${req.params.id}" deleted successfully.` });
  } catch (err) {
    console.error('DELETE /calls/:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
