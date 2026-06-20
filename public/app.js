/**
 * Call Quality Review Tool — Frontend Application
 * 
 * Handles all UI rendering, API communication, and user interactions.
 */

// ============================
// STATE
// ============================
const state = {
  calls: [],
  selectedCallId: null,
  selectedCallData: null,
  filterText: '',
  audioFile: null,
};

// ============================
// DOM REFS
// ============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  callList: $('#callList'),
  callListEmpty: $('#callListEmpty'),
  callCountBadge: $('#callCountBadge'),
  agentFilter: $('#agentFilter'),

  summaryBar: $('#summaryBar'),
  transcriptContainer: $('#transcriptContainer'),
  transcriptEmpty: $('#transcriptEmpty'),

  momentsList: $('#momentsList'),
  momentsEmpty: $('#momentsEmpty'),
  aiInsightsSection: $('#aiInsightsSection'),
  aiInsightsContent: $('#aiInsightsContent'),

  ingestModal: $('#ingestModal'),
  ingestTextarea: $('#ingestTextarea'),
  submitText: $('#submitText'),
  submitSpinner: $('#submitSpinner'),

  audioModal: $('#audioModal'),
  audioDropzone: $('#audioDropzone'),
  audioFileInput: $('#audioFileInput'),
  dropzoneIdle: $('#dropzoneIdle'),
  dropzoneSelected: $('#dropzoneSelected'),
  dropzoneProcessing: $('#dropzoneProcessing'),
  selectedFileName: $('#selectedFileName'),
  selectedFileSize: $('#selectedFileSize'),
  processingStep: $('#processingStep'),
  processingBarFill: $('#processingBarFill'),

  creditsModal: $('#creditsModal'),
};

// ============================
// SAMPLE DATA
// ============================
const SAMPLE_CALLS = [
  {
    id: 'call_001',
    agentName: 'Alice Johnson',
    timestamp: '2025-01-15T10:30:00Z',
    duration: 245,
    transcript: [
      { speaker: 'agent', text: 'Thank you for calling support, how can I help you today?', t: 0 },
      { speaker: 'customer', text: "I've been waiting three weeks for my refund and I still haven't received anything. This is completely unacceptable.", t: 7 },
      { speaker: 'agent', text: "I completely understand your frustration and I'm really sorry about the delay. Let me look into this right away.", t: 18 },
      { speaker: 'customer', text: "I want to speak to a manager. I'm going to cancel my account if this isn't resolved today.", t: 25 },
      { speaker: 'agent', text: 'Absolutely, let me pull up your account right now and get this sorted for you. I can see the refund was held up in processing. Let me escalate this immediately so we can get your money back as soon as possible.', t: 48 },
      { speaker: 'customer', text: 'Fine, but I expect to see it in my account by end of week.', t: 72 },
      { speaker: 'agent', text: "I understand completely. I've flagged this as urgent and you should see the refund within 2-3 business days. I'll also send you a confirmation email with the tracking details. Is there anything else I can help you with?", t: 78 },
      { speaker: 'customer', text: 'No, that will be all. Thank you.', t: 95 },
      { speaker: 'agent', text: "You're welcome, and again I apologize for the inconvenience. Have a great day!", t: 100 },
    ],
  },
  {
    id: 'call_002',
    agentName: 'Bob Martinez',
    timestamp: '2025-01-15T11:15:00Z',
    duration: 180,
    transcript: [
      { speaker: 'agent', text: 'Good morning, thank you for calling. My name is Bob, how can I assist you?', t: 0 },
      { speaker: 'customer', text: 'Hi Bob, I need help understanding my billing statement. There are some charges I don\'t recognize.', t: 5 },
      { speaker: 'agent', text: 'Of course, I\'d be happy to help you with that. Can I have your account number please?', t: 12 },
      { speaker: 'customer', text: 'Sure, it\'s 4582-9371. I see two charges from last week that I didn\'t authorize. One for $49.99 and another for $29.99. This is ridiculous, I never signed up for any additional services.', t: 18 },
      { speaker: 'agent', text: 'I can see why you\'d be concerned about those charges. Let me pull up your account and review the billing details.', t: 35 },
      { speaker: 'customer', text: 'Please do. And if these are unauthorized, I want a full refund immediately.', t: 55 },
      { speaker: 'agent', text: 'I understand your concern. Looking at your account now, I can see these charges are from an add-on service that was activated during your last call. It looks like there may have been a miscommunication. I\'m going to reverse both charges right now and remove the add-on from your account. You\'ll see the refund within 24 hours.', t: 60 },
      { speaker: 'customer', text: 'Okay, that sounds good. Thank you for taking care of it so quickly.', t: 90 },
      { speaker: 'agent', text: 'Absolutely! I\'m sorry for the confusion. Is there anything else I can help you with today?', t: 95 },
      { speaker: 'customer', text: 'No, that\'s everything. Thanks Bob.', t: 102 },
      { speaker: 'agent', text: 'You\'re welcome! Have a wonderful day!', t: 105 },
    ],
  },
  {
    id: 'call_003',
    agentName: 'Alice Johnson',
    timestamp: '2025-01-15T14:00:00Z',
    duration: 320,
    transcript: [
      { speaker: 'agent', text: 'Hello, thank you for contacting us. How may I help you today?', t: 0 },
      { speaker: 'customer', text: 'Your product is terrible. It broke after just two days. I want my money back and I\'m going to file a lawsuit if this isn\'t handled properly. This is the worst customer service experience I\'ve ever had. I\'ve been transferred three times already and nobody seems to know what they\'re doing. I am absolutely furious right now and I demand to speak with someone who can actually resolve this issue immediately.', t: 5 },
      { speaker: 'agent', text: 'I\'m so sorry to hear about your experience. That sounds incredibly frustrating, and I completely understand why you\'re upset.', t: 40 },
      { speaker: 'customer', text: 'You better understand. I paid good money for this product.', t: 48 },
      { speaker: 'agent', text: 'You\'re absolutely right, and I apologize for all the trouble you\'ve gone through. Let me take full ownership of this issue right now. I\'m going to process a complete refund for you and also send you a replacement product at no cost. Would that work for you?', t: 52 },
      { speaker: 'customer', text: 'Well... okay, that actually sounds fair. When would the replacement arrive?', t: 75 },
      { speaker: 'agent', text: 'I\'ll have it shipped via express delivery, so you should receive it within 2 business days. I\'ll also include a prepaid return label so you can send back the defective unit at no cost to you.', t: 80 },
      { speaker: 'customer', text: 'Alright, I appreciate that. Thank you for actually doing something about it.', t: 95 },
      { speaker: 'agent', text: 'Of course! I\'m sorry again for the experience. I\'ve also added a 20% discount code to your account for your next purchase as a goodwill gesture. Is there anything else I can do?', t: 100 },
      { speaker: 'customer', text: 'No, that\'s very generous. Thank you.', t: 115 },
      { speaker: 'agent', text: 'You\'re welcome. Have a great rest of your day!', t: 118 },
    ],
  },
];

// ============================
// API HELPERS
// ============================
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

async function apiGet(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

// ============================
// TOAST NOTIFICATIONS
// ============================
function showToast(message, type = 'success') {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================
// FORMAT HELPERS
// ============================
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(t) {
  return `${t}s`;
}

function formatMomentType(type) {
  const labels = {
    escalation_signal: '🔴 Escalation',
    empathy_statement: '💚 Empathy',
    dead_air: '⏸️ Dead Air',
    long_monologue: '📢 Monologue',
  };
  return labels[type] || type;
}

function formatMomentTypeShort(type) {
  const labels = {
    escalation_signal: 'Escalation',
    empathy_statement: 'Empathy',
    dead_air: 'Dead Air',
    long_monologue: 'Monologue',
  };
  return labels[type] || type;
}

function sentimentIcon(arc) {
  const icons = { improved: '📈', declined: '📉', neutral: '➡️' };
  return icons[arc] || '➡️';
}

function empathyClass(score) {
  if (score >= 0.7) return 'good';
  if (score >= 0.4) return 'warn';
  return 'bad';
}

function empathyBarClass(score) {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(name) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)', // Indigo-Purple
    'linear-gradient(135deg, #3b82f6, #06b6d4)', // Blue-Cyan
    'linear-gradient(135deg, #10b981, #14b8a6)', // Emerald-Teal
    'linear-gradient(135deg, #f59e0b, #e11d48)', // Amber-Rose
    'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink-Purple
  ];
  return gradients[hash % gradients.length];
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recent';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

// Helper to escape regex values
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================
// RENDER: CALL LIST
// ============================
function renderCallList() {
  const filtered = state.calls.filter(c =>
    c.agentName.toLowerCase().includes(state.filterText.toLowerCase())
  );

  // Update badge
  DOM.callCountBadge.textContent = `${state.calls.length} call${state.calls.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    DOM.callList.innerHTML = '';
    DOM.callList.appendChild(DOM.callListEmpty);
    DOM.callListEmpty.style.display = 'flex';
    return;
  }

  DOM.callListEmpty.style.display = 'none';

  const html = filtered.map((call, index) => {
    const initials = getInitials(call.agentName);
    const gradient = getAvatarGradient(call.agentName);
    const timeDisplay = formatRelativeTime(call.timestamp);
    const isActive = call.id === state.selectedCallId;

    return `
      <div
        class="call-card ripple-effect animate-stagger-in ${isActive ? 'active' : ''} sentiment-${call.sentimentArc} tilt-3d"
        data-id="${call.id}"
        style="animation-delay: ${index * 50}ms"
        onclick="selectCall('${call.id}')"
      >
        <div class="call-card-left-strip ${call.sentimentArc}"></div>
        <div class="call-card-container">
          <div class="call-card-header">
            <div class="agent-profile">
              <div class="agent-avatar" style="background: ${gradient}">${initials}</div>
              <div class="agent-info-compact">
                <span class="call-agent-name">${escapeHtml(call.agentName)}</span>
                <span class="call-timestamp">${timeDisplay}</span>
              </div>
            </div>
            <div class="call-card-header-actions">
              <span class="call-duration">⏱️ ${formatDuration(call.duration)}</span>
              <button class="btn-delete-call" onclick="event.stopPropagation(); deleteCallRecording('${call.id}')" title="Delete recording">🗑️</button>
            </div>
          </div>
          <div class="call-card-meta">
            <span class="source-badge ${call.source || 'json'}">${call.source === 'audio' ? '🎤 Audio' : '📄 JSON'}</span>
            <span class="meta-chip chip-moments">⚡ ${call.momentCount} moments</span>
            <span class="chip-sentiment ${call.sentimentArc}">${sentimentIcon(call.sentimentArc)} ${call.sentimentArc}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  DOM.callList.innerHTML = html;
}

// ============================
// RENDER: SUMMARY BAR
// ============================
function renderSummaryBar(data) {
  const { summary } = data;
  DOM.summaryBar.style.display = 'grid'; // Uses grid in upgraded styles.css

  DOM.summaryBar.innerHTML = `
    <!-- Card 1: Talk Ratio -->
    <div class="summary-card talk-ratio-card tilt-3d" style="animation-delay: 0ms">
      <div class="card-glow"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Talk Ratio</span>
        <span class="card-icon">🗣️</span>
      </div>
      <div class="talk-ratio-details">
        <div class="ratio-item agent">
          <span class="ratio-label">Agent</span>
          <span class="ratio-val">${summary.talkRatio.agent}%</span>
        </div>
        <div class="ratio-item customer">
          <span class="ratio-val">${summary.talkRatio.customer}%</span>
          <span class="ratio-label">Customer</span>
        </div>
      </div>
      <div class="talk-ratio-bar">
        <div class="ratio-agent" style="width: ${summary.talkRatio.agent}%" title="Agent Talk Time"></div>
        <div class="ratio-customer" style="width: ${summary.talkRatio.customer}%" title="Customer Talk Time"></div>
      </div>
    </div>

    <!-- Card 2: Empathy Score -->
    <div class="summary-card empathy-card ${empathyClass(summary.empathyScore)} tilt-3d" style="animation-delay: 100ms">
      <div class="card-glow"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Empathy Score</span>
        <span class="card-icon">💚</span>
      </div>
      <div class="empathy-stat-val animate-count-up">
        ${summary.empathyScore.toFixed(2)}
      </div>
      <div class="empathy-bar-container">
        <div class="empathy-bar">
          <div class="empathy-bar-fill ${empathyBarClass(summary.empathyScore)}" style="width: ${summary.empathyScore * 100}%"></div>
        </div>
      </div>
    </div>

    <!-- Card 3: Sentiment Arc -->
    <div class="summary-card sentiment-card sentiment-${summary.sentimentArc} tilt-3d" style="animation-delay: 200ms">
      <div class="card-glow"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Sentiment Arc</span>
        <span class="card-icon">${sentimentIcon(summary.sentimentArc)}</span>
      </div>
      <div class="sentiment-badge-wrapper">
        <span class="sentiment-badge-glow ${summary.sentimentArc}">
          ${summary.sentimentArc.toUpperCase()}
        </span>
      </div>
    </div>

    <!-- Card 4: Escalations -->
    <div class="summary-card escalations-card ${summary.escalationCount > 0 ? 'alert' : 'clear'} tilt-3d" style="animation-delay: 300ms">
      <div class="card-glow"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Escalations</span>
        <span class="card-icon">🔴</span>
      </div>
      <div class="escalation-count-val animate-count-up">
        ${summary.escalationCount}
      </div>
      <div class="escalation-badge-wrapper">
        <span class="escalation-status-badge ${summary.escalationCount > 0 ? 'active' : 'clear'}">
          ${summary.escalationCount > 0 ? '⚠️ Attention Needed' : '✅ Resolved/None'}
        </span>
      </div>
    </div>

    <!-- Card 5: Meta Details -->
    <div class="summary-card info-card tilt-3d" style="animation-delay: 400ms">
      <div class="card-glow"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Call Details</span>
        <span class="card-icon">📋</span>
      </div>
      <div class="info-item">
        <span class="info-label">Agent:</span>
        <span class="info-value text-glow">${escapeHtml(data.agentName)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Duration:</span>
        <span class="info-value time-font">⏱️ ${formatDuration(data.duration)}</span>
      </div>
    </div>

    <!-- Card 6: Export Actions -->
    <div class="summary-card export-card tilt-3d" style="animation-delay: 500ms">
      <div class="card-glow" style="background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);"></div>
      <div class="summary-card-header">
        <span class="summary-stat-label">Export Report</span>
        <span class="card-icon">📥</span>
      </div>
      <div class="export-actions">
        <button class="btn-export pdf" onclick="exportReport('pdf')" title="Export report to PDF">📄 PDF</button>
        <button class="btn-export word" onclick="exportReport('word')" title="Export report to Word">📝 Word</button>
      </div>
    </div>
  `;
}

// ============================
// RENDER: TRANSCRIPT
// ============================
function renderTranscript(data) {
  DOM.transcriptEmpty.style.display = 'none';

  if (!data.transcript || data.transcript.length === 0) {
    DOM.transcriptContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">Empty transcript</div>
        <div class="empty-state-text">This call has no transcript turns.</div>
      </div>
    `;
    return;
  }

  const html = data.transcript.map((turn, index) => {
    const moments = turn.moments || [];
    const momentTypes = moments.map(m => m.type);
    const hasMultiple = moments.length > 1;

    // Build CSS classes for moment highlighting
    let turnClasses = 'turn-bubble';
    if (hasMultiple) {
      turnClasses += ' has-multiple-moments';
    } else if (moments.length === 1) {
      turnClasses += ` has-${momentTypes[0]}`;
    }

    // Dead air indicator (shown before the turn if it has dead_air moment)
    const deadAirMoment = moments.find(m => m.type === 'dead_air');
    let deadAirHtml = '';
    if (deadAirMoment) {
      deadAirHtml = `
        <div class="dead-air-divider animate-stagger-in" style="animation-delay: ${index * 40}ms">
          <div class="divider-line"></div>
          <span class="divider-badge">
            <span class="divider-icon">⏳</span> ${deadAirMoment.matchedText} of silence
          </span>
          <div class="divider-line"></div>
        </div>
      `;
    }

    // Moment tags
    let momentTagsHtml = '';
    if (moments.length > 0) {
      momentTagsHtml = `
        <div class="bubble-moment-tags">
          ${moments.map(m => `
            <span class="moment-tag-badge ${m.type}">
              ${formatMomentTypeShort(m.type)}${m.type !== 'dead_air' && m.type !== 'long_monologue' ? `: "${escapeHtml(m.matchedText)}"` : ''}
            </span>
          `).join('')}
        </div>
      `;
    }

    // Highlight text based on moment keywords if possible (except monologue and dead air)
    let highlightedText = escapeHtml(turn.text);
    moments.forEach(m => {
      if (m.type === 'escalation_signal' || m.type === 'empathy_statement') {
        const keyword = m.matchedText;
        if (keyword) {
          try {
            const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlighted-keyword">$1</span>');
          } catch (e) {
            console.error(e);
          }
        }
      }
    });

    const initial = turn.speaker === 'agent' ? data.agentName[0] : 'C';
    const avatarGradient = turn.speaker === 'agent' 
      ? getAvatarGradient(data.agentName)
      : 'linear-gradient(135deg, #a855f7, #6366f1)';

    return `
      ${deadAirHtml}
      <div class="bubble-wrapper ${turn.speaker} animate-stagger-in" style="animation-delay: ${index * 40}ms" data-turn-index="${turn.turnIndex}">
        <div class="bubble-avatar-container">
          <div class="bubble-avatar" style="background: ${avatarGradient}" title="${turn.speaker === 'agent' ? escapeHtml(data.agentName) : 'Customer'}">
            ${initial}
          </div>
        </div>
        <div class="bubble-content-wrapper">
          <div class="bubble-header-meta">
            <span class="bubble-speaker-name">${turn.speaker === 'agent' ? escapeHtml(data.agentName) : 'Customer'}</span>
            <span class="bubble-timestamp">⏱️ ${formatTimestamp(turn.t)}</span>
          </div>
          <div class="${turnClasses}">
            <div class="bubble-text">${highlightedText}</div>
            ${momentTagsHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  DOM.transcriptContainer.innerHTML = html;
}

// ============================
// RENDER: MOMENTS SIDEBAR
// ============================
function renderMoments(moments, aiInsights) {
  if (!moments || moments.length === 0) {
    DOM.momentsList.innerHTML = '';
    DOM.momentsList.appendChild(DOM.momentsEmpty);
    DOM.momentsEmpty.style.display = 'flex';
    DOM.momentsEmpty.querySelector('.empty-state-title').textContent = 'No moments detected';
    DOM.momentsEmpty.querySelector('.empty-state-text').textContent = 'This call has no flagged moments.';
  } else {
    DOM.momentsEmpty.style.display = 'none';

    const html = moments.map((m, index) => `
      <div
        class="moment-card animate-slide-in-right"
        style="animation-delay: ${index * 60}ms"
        onclick="scrollToTurn(${m.turnIndex})"
      >
        <div class="moment-card-header">
          <span class="moment-type-badge ${m.type}">${formatMomentType(m.type)}</span>
          <span class="moment-time">${formatTimestamp(m.t)}</span>
        </div>
        <div class="moment-matched-text">
          ${m.type === 'dead_air'
            ? `⏸️ ${escapeHtml(m.matchedText)} of silence before ${m.speaker} spoke`
            : m.type === 'long_monologue'
              ? `📢 ${m.speaker === 'agent' ? 'Agent' : 'Customer'} spoke ${m.matchedText.split(/\s+/).length} words`
              : `"${escapeHtml(m.matchedText)}"`
          }
        </div>
      </div>
    `).join('');

    DOM.momentsList.innerHTML = html;
  }

  // AI Insights
  if (aiInsights) {
    DOM.aiInsightsSection.style.display = 'block';
    DOM.aiInsightsContent.textContent = aiInsights;
  } else {
    DOM.aiInsightsSection.style.display = 'none';
  }
}

// ============================
// ACTIONS
// ============================
async function loadCallList() {
  try {
    const filterParam = state.filterText ? `?agent=${encodeURIComponent(state.filterText)}` : '';
    state.calls = await apiGet(`/calls${filterParam}`);
    renderCallList();
  } catch (err) {
    console.error('Failed to load calls:', err);
    showToast('Failed to load call list', 'error');
  }
}

async function selectCall(callId) {
  state.selectedCallId = callId;
  renderCallList(); // Re-render to update active state

  try {
    // Show beautiful loading skeleton
    DOM.transcriptContainer.innerHTML = `
      <div class="transcript-skeleton-wrapper">
        ${Array(5).fill('').map((_, i) => `
          <div class="skeleton-bubble ${i % 2 === 0 ? 'left' : 'right'} animate-shimmer">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const data = await apiGet(`/calls/${callId}`);
    state.selectedCallData = data;

    renderSummaryBar(data);
    renderTranscript(data);
    renderMoments(data.moments, data.aiInsights);
  } catch (err) {
    console.error('Failed to load call:', err);
    showToast(`Failed to load call: ${err.message}`, 'error');
  }
}

function scrollToTurn(turnIndex) {
  const turnEl = DOM.transcriptContainer.querySelector(`[data-turn-index="${turnIndex}"]`);
  if (turnEl) {
    turnEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add glowing active effect
    const bubbleEl = turnEl.querySelector('.turn-bubble');
    if (bubbleEl) {
      bubbleEl.style.transition = 'all 0.3s ease';
      bubbleEl.classList.add('scrollTo-glow');
      setTimeout(() => {
        bubbleEl.classList.remove('scrollTo-glow');
      }, 2000);
    }
  }
}

function exportReport(format) {
  const data = state.selectedCallData;
  if (!data) {
    showToast('No call selected to export', 'error');
    return;
  }

  const { summary } = data;

  // Format moments table
  let momentsHtml = '';
  if (data.moments && data.moments.length > 0) {
    momentsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Time</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Speaker</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Moment Type</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Matched Content</th>
          </tr>
        </thead>
        <tbody>
          ${data.moments.map(m => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${formatTimestamp(m.t)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; text-transform: capitalize;">${m.speaker}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 500;">${formatMomentTypeShort(m.type)}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-style: italic;">${escapeHtml(m.matchedText)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    momentsHtml = '<p style="color: #64748b; font-style: italic;">No moments flagged in this call.</p>';
  }

  // Format transcript timeline
  const transcriptHtml = data.transcript.map(turn => `
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
      <span style="font-weight: bold; text-transform: uppercase; font-family: monospace; color: ${turn.speaker === 'agent' ? '#4f46e5' : '#7c3aed'};">
        [${formatTimestamp(turn.t)}] ${turn.speaker === 'agent' ? escapeHtml(data.agentName) : 'Customer'}:
      </span>
      <span style="margin-left: 8px; font-family: Arial, sans-serif;">${escapeHtml(turn.text)}</span>
    </div>
  `).join('');

  // Assemble base HTML content
  const reportTitle = `Observe.ai Call Quality Analysis Report — ${escapeHtml(data.agentName)}`;
  const bodyHtml = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; color: #1e1b4b; font-size: 28px;">Observe.ai</h1>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Call Quality Intelligence Platform</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold; color: #4f46e5; font-size: 14px; letter-spacing: 0.05em;">QUALITY AUDIT REPORT</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; font-family: monospace;">ID: ${data.id}</p>
        </div>
      </div>

      <h2 style="color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.02em;">1. Call & Evaluation Metadata</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc; width: 25%;">Agent Name</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 500;">${escapeHtml(data.agentName)}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc; width: 25%;">Duration</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${formatDuration(data.duration)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">Sentiment Arc</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-transform: uppercase; font-weight: bold; color: ${summary.sentimentArc === 'improved' ? '#16a34a' : summary.sentimentArc === 'declined' ? '#dc2626' : '#2563eb'};">${summary.sentimentArc}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">Source</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-transform: uppercase;">${data.source || 'json'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">Talk Ratio</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Agent: ${summary.talkRatio.agent}% | Customer: ${summary.talkRatio.customer}%</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc;">Date Audited</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(data.timestamp).toLocaleString()}</td>
        </tr>
      </table>

      <h2 style="color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.02em;">2. Performance & Anomaly Analytics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Evaluated Metric</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 120px;">Result Value</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Operational Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Empathy Score</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${summary.empathyScore >= 0.7 ? '#16a34a' : summary.empathyScore >= 0.4 ? '#d97706' : '#dc2626'};">${summary.empathyScore.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Ratio of empathy signals to customer escalations (Max 1.0)</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Escalation Count</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${summary.escalationCount > 0 ? '#dc2626' : '#16a34a'};">${summary.escalationCount}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Detected customer frustration or manager requests</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Empathy Statement Count</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${summary.empathyCount || 0}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Agent statements showing validation, apologies, or sorry</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Dead Air Events</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${summary.deadAirCount > 0 ? '#d97706' : '#16a34a'};">${summary.deadAirCount || 0}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Gaps of silence between speaking turns exceeding 15 seconds</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Long Monologues</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${summary.longMonologueCount || 0}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">Single speaking turns exceeding 50 words</td>
          </tr>
        </tbody>
      </table>

      <h2 style="color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.02em;">3. AI Coaching Recommendations</h2>
      <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 16px; border-radius: 4px; margin-bottom: 25px; font-size: 13.5px; white-space: pre-wrap; font-family: Georgia, serif; line-height: 1.65; color: #334155; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        ${escapeHtml(data.aiInsights || 'No coaching insights generated.')}
      </div>

      <h2 style="color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.02em;">4. Flagged Moments Index</h2>
      <div style="margin-bottom: 25px; font-size: 13px;">
        ${momentsHtml}
      </div>

      <h2 style="color: #1e293b; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.02em;">5. Transcription Timeline</h2>
      <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; background: #fff; font-size: 13px; max-height: 400px; overflow-y: auto;">
        ${transcriptHtml}
      </div>

      <div style="margin-top: 50px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        Report dynamically generated by Observe.ai Call Intelligence Suite • Confidential Internal Use Only
      </div>
    </div>
  `;

  if (format === 'pdf') {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .print-btn-header { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-header" style="text-align: right; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">🖨️ Print / Save as PDF</button>
        </div>
        ${bodyHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
  } else if (format === 'word') {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cccccc; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Call_Report_${data.id}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📝 Word document download started');
  }
}

window.exportReport = exportReport;

async function ingestCall(jsonStr) {
  try {
    const body = JSON.parse(jsonStr);
    const result = await apiPost('/calls', body);
    showToast(`✨ Call "${result.callId}" ingested — ${result.momentCount} moments detected`);
    await loadCallList();
    return true;
  } catch (err) {
    if (err instanceof SyntaxError) {
      showToast('Invalid JSON — please check your input', 'error');
    } else {
      showToast(`Ingestion failed: ${err.message}`, 'error');
    }
    return false;
  }
}

async function loadSampleData() {
  const btn = $('#btnLoadSample');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner" style="width:14px;height:14px;"></span> Loading...';

  let loaded = 0;
  for (const sample of SAMPLE_CALLS) {
    try {
      await apiPost('/calls', sample);
      loaded++;
    } catch (err) {
      console.warn(`Sample ${sample.id} may already exist:`, err.message);
    }
  }

  btn.disabled = false;
  btn.innerHTML = '📋 Load Samples';

  if (loaded > 0) {
    showToast(`Loaded ${loaded} sample call${loaded > 1 ? 's' : ''} with AI analysis`);
    await loadCallList();
  } else {
    showToast('Samples already loaded', 'error');
  }
}

// ============================
// AUDIO UPLOAD
// ============================
function setAudioFile(file) {
  if (!file) return;

  // Validate size (25MB max)
  if (file.size > 25 * 1024 * 1024) {
    showToast('File too large. Maximum size is 25MB.', 'error');
    return;
  }

  state.audioFile = file;
  DOM.dropzoneIdle.style.display = 'none';
  DOM.dropzoneSelected.style.display = 'flex';
  DOM.dropzoneProcessing.style.display = 'none';
  DOM.selectedFileName.textContent = file.name;
  DOM.selectedFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  $('#audioModalSubmit').disabled = false;
}

function resetAudioDropzone() {
  state.audioFile = null;
  DOM.dropzoneIdle.style.display = 'flex';
  DOM.dropzoneSelected.style.display = 'none';
  DOM.dropzoneProcessing.style.display = 'none';
  DOM.audioFileInput.value = '';
  $('#audioModalSubmit').disabled = true;
}

function showAudioProcessing(step, progress) {
  DOM.dropzoneIdle.style.display = 'none';
  DOM.dropzoneSelected.style.display = 'none';
  DOM.dropzoneProcessing.style.display = 'flex';
  DOM.processingStep.textContent = step;
  DOM.processingBarFill.style.width = `${progress}%`;
}

async function uploadAudioFile() {
  if (!state.audioFile) return;

  const agentName = $('#audioAgentName').value.trim() || 'Unknown Agent';
  const formData = new FormData();
  formData.append('audio', state.audioFile);
  formData.append('agentName', agentName);
  formData.append('id', `call_${Date.now()}`);

  try {
    // Show processing states
    showAudioProcessing('Uploading audio file...', 15);
    $('#audioModalSubmit').disabled = true;
    $('#audioSubmitText').style.display = 'none';
    $('#audioSubmitSpinner').style.display = 'inline-block';

    // Simulate progress steps (actual processing happens server-side)
    const progressSteps = [
      { msg: 'Transcribing with Groq Whisper...', pct: 35, delay: 1500 },
      { msg: 'Identifying speakers with AI...', pct: 60, delay: 3000 },
      { msg: 'Detecting moments...', pct: 80, delay: 1000 },
      { msg: 'Generating AI insights...', pct: 90, delay: 1500 },
    ];

    // Run progress animation in background
    const progressPromise = (async () => {
      for (const step of progressSteps) {
        await new Promise(r => setTimeout(r, step.delay));
        showAudioProcessing(step.msg, step.pct);
      }
    })();

    // Actual upload
    const res = await fetch('/calls/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    // Wait for progress animation to finish
    await progressPromise;
    showAudioProcessing('Complete! ✅', 100);
    await new Promise(r => setTimeout(r, 500));

    showToast(`🎤 Audio transcribed — ${data.turnCount} turns, ${data.momentCount} moments detected`);
    await loadCallList();
    closeModal(DOM.audioModal);
    resetAudioDropzone();

    // Auto-select the new call
    selectCall(data.callId);
  } catch (err) {
    console.error('Audio upload error:', err);
    showToast(`Audio upload failed: ${err.message}`, 'error');
    resetAudioDropzone();
  } finally {
    $('#audioSubmitText').style.display = 'inline';
    $('#audioSubmitSpinner').style.display = 'none';
    $('#audioModalSubmit').disabled = false;
  }
}

// ============================
// MODAL MANAGEMENT
// ============================
function openModal(modalEl) {
  modalEl.classList.add('active');
}

// Expose openModal to DOM context (fixes potential context bounds)
window.openModal = openModal;

function closeModal(modalEl) {
  modalEl.classList.remove('active');
}

// Expose closeModal to DOM context
window.closeModal = closeModal;

// Expose selectCall and scrollToTurn globally to resolve inline onclick bounds
window.selectCall = selectCall;
window.scrollToTurn = scrollToTurn;

// ============================
// HTML ESCAPE
// ============================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================
// EVENT LISTENERS
// ============================
document.addEventListener('DOMContentLoaded', () => {
  // Load call list on startup
  loadCallList();

  // Filter input
  DOM.agentFilter.addEventListener('input', (e) => {
    state.filterText = e.target.value;
    loadCallList();
  });

  // --- JSON Ingest Modal ---
  $('#btnIngest').addEventListener('click', () => {
    DOM.ingestTextarea.value = '';
    openModal(DOM.ingestModal);
    setTimeout(() => DOM.ingestTextarea.focus(), 300);
  });

  $('#modalClose').addEventListener('click', () => closeModal(DOM.ingestModal));
  $('#modalCancel').addEventListener('click', () => closeModal(DOM.ingestModal));

  $('#modalSubmit').addEventListener('click', async () => {
    const json = DOM.ingestTextarea.value.trim();
    if (!json) {
      showToast('Please paste a JSON transcript', 'error');
      return;
    }

    DOM.submitText.style.display = 'none';
    DOM.submitSpinner.style.display = 'inline-block';
    $('#modalSubmit').disabled = true;

    const success = await ingestCall(json);

    DOM.submitText.style.display = 'inline';
    DOM.submitSpinner.style.display = 'none';
    $('#modalSubmit').disabled = false;

    if (success) {
      closeModal(DOM.ingestModal);
    }
  });

  // --- Audio Upload Modal ---
  $('#btnUploadAudio').addEventListener('click', () => {
    resetAudioDropzone();
    $('#audioAgentName').value = '';
    openModal(DOM.audioModal);
  });

  $('#audioModalClose').addEventListener('click', () => closeModal(DOM.audioModal));
  $('#audioModalCancel').addEventListener('click', () => closeModal(DOM.audioModal));
  $('#audioModalSubmit').addEventListener('click', uploadAudioFile);
  $('#btnRemoveFile').addEventListener('click', (e) => {
    e.stopPropagation();
    resetAudioDropzone();
  });

  // Dropzone click → open file picker
  DOM.audioDropzone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveFile')) return;
    if (DOM.dropzoneProcessing.style.display !== 'none') return;
    DOM.audioFileInput.click();
  });

  // File input change
  DOM.audioFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  });

  // Drag and drop
  DOM.audioDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.audioDropzone.classList.add('drag-over');
  });

  DOM.audioDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    DOM.audioDropzone.classList.remove('drag-over');
  });

  DOM.audioDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.audioDropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      setAudioFile(e.dataTransfer.files[0]);
    }
  });

  // --- Click overlay to close modals ---
  DOM.ingestModal.addEventListener('click', (e) => {
    if (e.target === DOM.ingestModal) closeModal(DOM.ingestModal);
  });
  DOM.audioModal.addEventListener('click', (e) => {
    if (e.target === DOM.audioModal) closeModal(DOM.audioModal);
  });
  DOM.creditsModal.addEventListener('click', (e) => {
    if (e.target === DOM.creditsModal) closeModal(DOM.creditsModal);
  });

  // --- Credits modal ---
  $('#btnCredits').addEventListener('click', () => openModal(DOM.creditsModal));
  $('#creditsClose').addEventListener('click', () => closeModal(DOM.creditsModal));

  // --- Load sample data ---
  $('#btnLoadSample').addEventListener('click', loadSampleData);

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(DOM.ingestModal);
      closeModal(DOM.audioModal);
      closeModal(DOM.creditsModal);
    }
  });
});

async function deleteCallRecording(id) {
  if (!confirm(`Are you sure you want to delete call recording "${id}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/calls/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Failed to delete call');

    showToast(`🗑️ Call "${id}" deleted successfully`);

    if (state.selectedCallId === id) {
      state.selectedCallId = null;
      state.selectedCallData = null;
      
      DOM.summaryBar.style.display = 'none';
      DOM.aiInsightsSection.style.display = 'none';
      
      DOM.transcriptContainer.innerHTML = '';
      DOM.transcriptContainer.appendChild(DOM.transcriptEmpty);
      DOM.transcriptEmpty.style.display = 'flex';
      
      DOM.momentsList.innerHTML = '';
      DOM.momentsList.appendChild(DOM.momentsEmpty);
      DOM.momentsEmpty.style.display = 'flex';
    }

    await loadCallList();
  } catch (err) {
    console.error('Delete call error:', err);
    showToast(`Failed to delete call: ${err.message}`, 'error');
  }
}

window.deleteCallRecording = deleteCallRecording;

// ==========================================================================
// 3D INTERACTIVE CARD TILT & SPOTLIGHT GLOW SHINE
// ==========================================================================
let currentTiltElement = null;

document.addEventListener('mousemove', (e) => {
  const tiltCard = e.target.closest('.tilt-3d');
  
  if (currentTiltElement && currentTiltElement !== tiltCard) {
    resetTilt(currentTiltElement);
    currentTiltElement = null;
  }
  
  if (tiltCard) {
    currentTiltElement = tiltCard;
    applyTilt(tiltCard, e);
  }
});

document.addEventListener('mouseleave', () => {
  if (currentTiltElement) {
    resetTilt(currentTiltElement);
    currentTiltElement = null;
  }
});

function applyTilt(card, e) {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const xc = rect.width / 2;
  const yc = rect.height / 2;
  
  const maxTilt = 8; // degrees
  const tiltX = ((yc - y) / yc) * maxTilt;
  const tiltY = ((x - xc) / xc) * maxTilt;
  
  card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  card.style.setProperty('--shine-x', `${((x / rect.width) * 100).toFixed(1)}%`);
  card.style.setProperty('--shine-y', `${((y / rect.height) * 100).toFixed(1)}%`);
}

function resetTilt(card) {
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  card.style.setProperty('--shine-x', '50%');
  card.style.setProperty('--shine-y', '50%');
}
