/**
 * Groq AI Integration Module
 * 
 * Uses the Groq API for:
 * 1. Whisper audio transcription (speech-to-text)
 * 2. AI-powered speaker diarization (identifying agent vs customer)
 * 3. AI-powered coaching insights for call analysis
 */

const fs = require('fs');
const Groq = require('groq-sdk');

let groqClient = null;

function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

/**
 * Transcribe an audio file using Groq Whisper.
 * Returns verbose JSON with segment-level timestamps.
 * 
 * @param {string} filePath - Absolute path to the audio file
 * @returns {Promise<{text: string, segments: Array}>} Transcription result
 */
async function transcribeAudio(filePath) {
  try {
    const transcription = await getGroq().audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      language: 'en',
    });

    return {
      text: transcription.text,
      segments: transcription.segments || [],
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error('Groq Whisper transcription error:', error.message);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

/**
 * Use Groq LLM to perform speaker diarization on transcribed segments.
 * Identifies which segments belong to the agent vs customer.
 * 
 * @param {Array} segments - Whisper segments with timestamps
 * @param {string} fullText - Full transcription text
 * @returns {Promise<Array<{speaker: string, text: string, t: number}>>} Diarized turns
 */
async function diarizeTranscript(segments, fullText) {
  try {
    // Build segment text for the LLM
    const segmentList = segments.map((seg, i) =>
      `[${i}] (${Math.round(seg.start)}s - ${Math.round(seg.end)}s): "${seg.text.trim()}"`
    ).join('\n');

    const prompt = `You are an expert at analyzing customer support call transcripts. Below are timestamped segments from a call between a support AGENT and a CUSTOMER.

Your task: For each segment, determine if the speaker is "agent" or "customer".

Rules:
- The first speaker is usually the agent (greeting)
- Agents use professional language, greetings, offer help, apologize, resolve issues
- Customers describe problems, ask questions, express frustration, make requests
- Track conversation flow: speakers typically alternate
- If consecutive segments seem to be from the same speaker (e.g., brief pauses), group them

SEGMENTS:
${segmentList}

Respond ONLY with a JSON array. Each element should have:
- "segmentIndices": array of segment indices that belong to this turn (group consecutive same-speaker segments)
- "speaker": "agent" or "customer"

Example response:
[
  {"segmentIndices": [0], "speaker": "agent"},
  {"segmentIndices": [1, 2], "speaker": "customer"},
  {"segmentIndices": [3], "speaker": "agent"}
]

Return ONLY valid JSON, no explanation.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '[]';
    let diarization;
    
    try {
      const parsed = JSON.parse(responseText);
      // Handle both direct array and wrapped object responses
      diarization = Array.isArray(parsed) ? parsed : (parsed.turns || parsed.segments || parsed.data || []);
    } catch {
      console.warn('Failed to parse diarization JSON, using fallback');
      return fallbackDiarization(segments);
    }

    // Convert diarization to turns
    const turns = [];
    for (const group of diarization) {
      const indices = group.segmentIndices || [group.index || 0];
      const speaker = group.speaker || 'agent';

      // Merge text from grouped segments
      const groupSegments = indices
        .map(i => segments[i])
        .filter(Boolean);

      if (groupSegments.length === 0) continue;

      const text = groupSegments.map(s => s.text.trim()).join(' ');
      const t = Math.round(groupSegments[0].start);

      turns.push({ speaker, text, t });
    }

    return turns.length > 0 ? turns : fallbackDiarization(segments);
  } catch (error) {
    console.error('Diarization error:', error.message);
    return fallbackDiarization(segments);
  }
}

/**
 * Fallback diarization: alternate speakers starting with agent.
 * Used when AI diarization fails.
 */
function fallbackDiarization(segments) {
  const turns = [];
  let currentSpeaker = 'agent';

  for (const seg of segments) {
    turns.push({
      speaker: currentSpeaker,
      text: seg.text.trim(),
      t: Math.round(seg.start),
    });
    currentSpeaker = currentSpeaker === 'agent' ? 'customer' : 'agent';
  }

  return turns;
}

/**
 * Full audio processing pipeline:
 * 1. Transcribe with Whisper
 * 2. Diarize with LLM
 * 3. Return structured transcript
 * 
 * @param {string} filePath - Path to audio file
 * @param {string} agentName - Agent name for the call
 * @returns {Promise<{transcript: Array, duration: number, rawText: string}>}
 */
async function processAudioFile(filePath, agentName) {
  console.log(`  📝 Transcribing audio with Groq Whisper...`);
  const { text, segments, duration } = await transcribeAudio(filePath);

  if (!segments || segments.length === 0) {
    throw new Error('No speech detected in audio file.');
  }

  console.log(`  🔍 Diarizing ${segments.length} segments with AI...`);
  const transcript = await diarizeTranscript(segments, text);

  console.log(`  ✅ Processed ${transcript.length} turns from audio`);

  return {
    transcript,
    duration: Math.round(duration),
    rawText: text,
  };
}

/**
 * Generate an AI-powered coaching summary for a call.
 * 
 * @param {Array<{speaker: string, text: string, t: number}>} turns
 * @param {Array} moments
 * @param {{talkRatio: object, escalationCount: number, empathyScore: number, sentimentArc: string}} summary
 * @returns {Promise<string>} AI-generated coaching notes
 */
async function generateAIInsights(turns, moments, summary) {
  try {
    const transcriptText = turns.map(t =>
      `[${t.t}s] ${t.speaker.toUpperCase()}: ${t.text}`
    ).join('\n');

    const momentsSummary = moments.length > 0
      ? moments.map(m => `- ${m.type} at ${m.t}s (${m.speaker}): "${m.matchedText}"`).join('\n')
      : 'No moments detected.';

    const prompt = `You are a call center quality analyst. Analyze this customer support call and provide brief, actionable coaching notes for the supervisor.

TRANSCRIPT:
${transcriptText}

DETECTED MOMENTS:
${momentsSummary}

METRICS:
- Talk ratio: Agent ${summary.talkRatio.agent}% / Customer ${summary.talkRatio.customer}%
- Escalation count: ${summary.escalationCount}
- Empathy score: ${summary.empathyScore.toFixed(2)}
- Sentiment arc: ${summary.sentimentArc}

Provide a concise coaching summary (3-5 bullet points) focusing on:
1. What the agent did well
2. Areas for improvement
3. Specific actionable recommendations

Keep it brief and direct. No fluff.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    return chatCompletion.choices[0]?.message?.content || 'No insights generated.';
  } catch (error) {
    console.error('Groq AI error:', error.message);
    return 'AI insights unavailable — could not reach Groq API.';
  }
}

module.exports = { transcribeAudio, diarizeTranscript, processAudioFile, generateAIInsights };
