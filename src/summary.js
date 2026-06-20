/**
 * Call Summary Module
 * 
 * Computes the summary object for a call based on its turns and detected moments.
 */

/**
 * Compute a call summary.
 * 
 * @param {Array<{speaker: string, text: string, t: number}>} turns
 * @param {Array<{type: string, turnIndex: number}>} moments
 * @returns {{talkRatio: {agent: number, customer: number}, escalationCount: number, empathyScore: number, sentimentArc: string}}
 */
function computeSummary(turns, moments) {
  // --- Talk ratio (turn count, not word count) ---
  const agentTurns = turns.filter(t => t.speaker === 'agent').length;
  const customerTurns = turns.filter(t => t.speaker === 'customer').length;
  const totalTurns = agentTurns + customerTurns;

  const talkRatio = totalTurns > 0
    ? {
        agent: Math.round((agentTurns / totalTurns) * 100),
        customer: Math.round((customerTurns / totalTurns) * 100),
      }
    : { agent: 0, customer: 0 };

  // --- Escalation count ---
  const escalationMoments = moments.filter(m => m.type === 'escalation_signal');
  const escalationCount = escalationMoments.length;

  // --- Empathy score & counts ---
  const empathyCount = moments.filter(m => m.type === 'empathy_statement').length;
  const deadAirCount = moments.filter(m => m.type === 'dead_air').length;
  const longMonologueCount = moments.filter(m => m.type === 'long_monologue').length;

  let empathyScore;
  if (escalationCount === 0) {
    empathyScore = 1.0;
  } else {
    empathyScore = Math.min(empathyCount / escalationCount, 1.0);
  }

  // --- Sentiment arc ---
  const sentimentArc = computeSentimentArc(turns, escalationMoments);

  return {
    talkRatio,
    escalationCount,
    empathyCount,
    deadAirCount,
    longMonologueCount,
    empathyScore,
    sentimentArc,
  };
}

/**
 * Compute the sentiment arc based on escalation signal distribution.
 * 
 * Split turns into first half and second half.
 * - Escalation only in first half → "improved"
 * - Escalation only in second half → "declined"
 * - Otherwise → "neutral"
 * 
 * @param {Array} turns
 * @param {Array} escalationMoments
 * @returns {string}
 */
function computeSentimentArc(turns, escalationMoments) {
  if (escalationMoments.length === 0) {
    return 'neutral';
  }

  const midpoint = Math.ceil(turns.length / 2);

  let hasFirstHalf = false;
  let hasSecondHalf = false;

  for (const moment of escalationMoments) {
    if (moment.turnIndex < midpoint) {
      hasFirstHalf = true;
    } else {
      hasSecondHalf = true;
    }
  }

  if (hasFirstHalf && !hasSecondHalf) {
    return 'improved';
  } else if (!hasFirstHalf && hasSecondHalf) {
    return 'declined';
  } else {
    return 'neutral';
  }
}

module.exports = { computeSummary };
