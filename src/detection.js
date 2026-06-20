/**
 * Moment Detection Module
 * 
 * Implements detectMoments(turns) — takes a turns array and returns
 * a list of moment objects applying all four detection rules.
 */

// --- Escalation signal keywords (customer turns only) ---
const ESCALATION_KEYWORDS = [
  'cancel', 'refund', 'manager', 'lawsuit', 'ridiculous', 'unacceptable'
];



// --- Thresholds ---
const DEAD_AIR_THRESHOLD_SECONDS = 15;
const LONG_MONOLOGUE_WORD_THRESHOLD = 50;

/**
 * Detect all moments in a transcript's turns array.
 * 
 * @param {Array<{speaker: string, text: string, t: number}>} turns
 * @returns {Array<{type: string, turnIndex: number, t: number, speaker: string, matchedText: string}>}
 */
function detectMoments(turns) {
  const moments = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const textLower = turn.text.toLowerCase();

    // 1. Escalation signal — customer turns only
    if (turn.speaker === 'customer') {
      for (const keyword of ESCALATION_KEYWORDS) {
        if (textLower.includes(keyword)) {
          moments.push({
            type: 'escalation_signal',
            turnIndex: i,
            t: turn.t,
            speaker: turn.speaker,
            matchedText: keyword,
          });
        }
      }
    }

    // 2. Empathy statement — agent turns only
    if (turn.speaker === 'agent') {
      const empathyKeywords = ['understand', 'sorry', 'apologize', 'apologise'];
      for (const keyword of empathyKeywords) {
        if (textLower.includes(keyword)) {
          moments.push({
            type: 'empathy_statement',
            turnIndex: i,
            t: turn.t,
            speaker: turn.speaker,
            matchedText: keyword,
          });
        }
      }
      if (textLower.includes('i can see why')) {
        moments.push({
          type: 'empathy_statement',
          turnIndex: i,
          t: turn.t,
          speaker: turn.speaker,
          matchedText: 'i can see why',
        });
      }
    }

    // 3. Dead air — gap between consecutive turns > 15s
    if (i > 0) {
      const prevTurn = turns[i - 1];
      const gap = turn.t - prevTurn.t;
      if (gap > DEAD_AIR_THRESHOLD_SECONDS) {
        moments.push({
          type: 'dead_air',
          turnIndex: i,
          t: turn.t,
          speaker: turn.speaker,
          matchedText: `${gap}s gap`,
        });
      }
    }

    // 4. Long monologue — either speaker, > 50 words
    const wordCount = turn.text.trim().split(/\s+/).length;
    if (wordCount > LONG_MONOLOGUE_WORD_THRESHOLD) {
      moments.push({
        type: 'long_monologue',
        turnIndex: i,
        t: turn.t,
        speaker: turn.speaker,
        matchedText: turn.text,
      });
    }
  }

  return moments;
}

module.exports = { detectMoments };
