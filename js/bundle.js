/**
 * UniPulse Standalone Production Bundle
 * Designed for zero-dependency execution across HTTP and direct file:// preview.
 */
(function() {
  'use strict';

  // --- Source: js/data.js ---
  // =========================================================================
  // UniPulse Core State Store & REST / SSE API Client
  // =========================================================================
  
  const API_BASE = '/api';
  
  const AppState = {
    user: {
      id: 'user-alex',
      name: 'Alex Rivera',
      email: 'alex@campus.edu',
      role: 'student', // 'student' | 'admin'
      student_id: 'CS-2027-4819',
      major: 'B.S. Computer Science',
      grad_year: "'27",
      interests: ['AI & Coding', 'Robotics', 'Hackathons', 'Campus Life'],
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    token: localStorage.getItem('unipulse_token') || 'demo-token',
    activeView: 'dashboard',
    searchQuery: '',
    unreadNotifications: 2,
    assistantSessionId: 'sess-' + Math.random().toString(36).substring(2, 9),
    spaces: [],
    locations: [],
    events: [],
    matches: [],
    rsvps: new Set(['ev-1']),
    subscribers: []
  };
  
  const CampusConstants = {
    heroSuggestions: [
      "Where is the quietest study spot with power outlets right now?",
      "40 mins free: where to study quietly?",
      "Did anyone find a navy blue Hydro Flask near Main Library?",
      "How do I walk from Block 34 to the Sports Complex?",
      "Where is the Tech & AI Hackathon happening this Friday?"
    ],
    locations: [
      { id: 'b34', code: 'B34', name: 'Block 34 (Engineering & CS)', x: 180, y: 190, type: 'block' },
      { id: 'lib', code: 'LIB', name: 'Main University Library', x: 460, y: 240, type: 'library' },
      { id: 'sport', code: 'SC', name: 'Sports Complex', x: 720, y: 380, type: 'sports_complex' },
      { id: 'sc', code: 'SCX', name: 'Student Commons & Dining', x: 420, y: 420, type: 'study_space' },
      { id: 'inn', code: 'INNO', name: 'Innovation & Incubation Hub', x: 260, y: 480, type: 'block' }
    ]
  };
  
  // API Client with automatic JWT injection & error handling
  const ApiClient = {
    async request(endpoint, options = {}) {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(AppState.token ? { 'Authorization': `Bearer ${AppState.token}` } : {}),
        ...(options.headers || {})
      };
  
      try {
        const response = await fetch(url, { ...options, headers });
        const json = await response.json();
        if (!response.ok || json.error) {
          throw new Error(json.error?.message || `HTTP error ${response.status}`);
        }
        return json.data;
      } catch (err) {
        console.warn(`[ApiClient] Request failed for ${url}:`, err.message);
        throw err;
      }
    },
  
    get(endpoint) {
      return this.request(endpoint, { method: 'GET' });
    },
  
    post(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
  
    put(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
  
    // Streaming AI Assistant helper with fallback
    async streamAssistant(message, sessionId, onToken, onComplete, onError) {
      const url = `${API_BASE}/assistant/message`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(AppState.token ? { 'Authorization': `Bearer ${AppState.token}` } : {})
      };
  
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message, session_id: sessionId, stream: true })
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
  
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/event-stream') || !response.body) {
          // Fallback for non-streaming response
          const json = await response.json();
          if (json.error) throw new Error(json.error.message);
          if (onComplete) onComplete(json.data);
          return json.data;
        }
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let completeData = null;
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep last partial line in buffer
  
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const rawJson = trimmed.slice(5).trim();
              if (rawJson) {
                try {
                  const parsed = JSON.parse(rawJson);
                  if (parsed.type === 'token' && onToken) {
                    onToken(parsed.token);
                  } else if (parsed.type === 'complete') {
                    completeData = parsed;
                    if (onComplete) onComplete(parsed);
                  }
                } catch (e) {
                  // Ignore parse errors on keepalive or partial lines
                }
              }
            }
          }
        }
  
        return completeData;
      } catch (err) {
        console.warn('[ApiClient] Stream error, falling back to standard POST:', err.message);
        try {
          const fallbackRes = await this.post('/assistant/message', { message, session_id: sessionId });
          if (onComplete) onComplete(fallbackRes);
          return fallbackRes;
        } catch (fallbackErr) {
          if (onError) onError(fallbackErr);
          throw fallbackErr;
        }
      }
    },
  
    // Realtime Server-Sent Events (SSE) Listener for Study Space Occupancy
    connectRealtime(onOccupancyUpdate) {
      try {
        const es = new EventSource('/api/realtime/study-spaces');
        es.addEventListener('occupancy', (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (onOccupancyUpdate) onOccupancyUpdate(payload);
          } catch (err) {
            console.error('[SSE] Failed to parse message', err);
          }
        });
        es.onerror = () => {
          es.close();
          // Retry connection in 6 seconds
          setTimeout(() => ApiClient.connectRealtime(onOccupancyUpdate), 6000);
        };
        return es;
      } catch (e) {
        console.warn('[SSE] EventSource unavailable:', e);
        return null;
      }
    }
  };
  
  // Simple global event bus / state change subscriber
  function subscribeState(callback) {
    AppState.subscribers.push(callback);
  }
  
  function notifyStateChange(viewName) {
    AppState.subscribers.forEach(fn => fn(viewName || AppState.activeView));
  }

  // --- Source: js/components/toasts.js ---
  // =========================================================================
  // Toast Notification Manager with Web Audio API Chime Synthesis
  // =========================================================================
  
  let audioCtx = null;
  
  function playNotificationChime(type = 'success') {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (!audioCtx) return;
  
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
  
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
  
      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24); // G5
      } else {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.18);
      }
  
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  
      osc.connect(gain);
      gain.connect(audioCtx.destination);
  
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Audio contexts may be blocked by browser autoplay policies
    }
  }
  
  function showToast(message, type = 'success', title = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4 sm:px-0';
      document.body.appendChild(container);
    }
  
    playNotificationChime(type);
  
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-start gap-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 transform transition-all duration-300 translate-y-4 opacity-0';
  
    const iconBg = type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                   type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                   'bg-indigo-50 text-indigo-600 border border-indigo-200';
  
    const iconSvg = type === 'success' ?
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' :
      type === 'error' ?
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>' :
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  
    toast.innerHTML = `
      <div class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}">
        ${iconSvg}
      </div>
      <div class="flex-1 min-w-0 pt-0.5">
        ${title ? `<h4 class="text-sm font-semibold text-slate-900">${title}</h4>` : ''}
        <p class="text-xs text-slate-600 leading-relaxed">${message}</p>
      </div>
      <button class="text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;
  
    container.appendChild(toast);
  
    // Trigger smooth entrance
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });
  
    // Auto-dismiss after 4.5s
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Source: js/components/modals.js ---
  // =========================================================================
  // UniPulse Modal Dialogs: Report Intake, 91% Match Analysis, Desk Pass, ⌘K
  // =========================================================================
  
  function getModalRoot() {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    return root;
  }
  
  function closeModal() {
    const root = getModalRoot();
    root.innerHTML = '';
  }
  
  // -------------------------------------------------------------------------
  // 1. Report Lost / Found Item Modal with Image Upload
  // -------------------------------------------------------------------------
  function openReportModal(kind = 'lost') {
    const root = getModalRoot();
    const isLost = kind === 'lost';
  
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="glass-modal max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
  
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center ${isLost ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} font-bold">
              ${isLost ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'}
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-900">${isLost ? 'Report Lost Belonging' : 'Report Found Belonging'}</h3>
              <p class="text-xs text-slate-500">AI similarity search triggers automatically upon submission</p>
            </div>
          </div>
  
          <form id="report-item-form" class="space-y-4" onsubmit="UniPulse.handleReportSubmit(event, '${kind}')">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Item Title *</label>
              <input id="report-title" required type="text" placeholder="e.g. Hydro Flask Navy Blue 32oz, Lenovo ThinkPad Charger"
                class="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none">
            </div>
  
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select id="report-category" class="w-full px-3 py-2.5 rounded-xl glass-input text-sm focus:outline-none">
                  <option value="Bottles & Containers">Bottles & Containers</option>
                  <option value="Electronics">Electronics & Laptops</option>
                  <option value="Keys & Cards">Keys & Campus IDs</option>
                  <option value="Bags & Backpacks">Bags & Backpacks</option>
                  <option value="Books & Notes">Books & Stationery</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Campus Location</label>
                <select id="report-location" class="w-full px-3 py-2.5 rounded-xl glass-input text-sm focus:outline-none">
                  <option value="lib">Main Library</option>
                  <option value="b34">Block 34 (Engineering)</option>
                  <option value="sport">Sports Complex</option>
                  <option value="sc">Student Commons</option>
                  <option value="inn">Innovation Hub</option>
                </select>
              </div>
            </div>
  
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Distinct Features / Description</label>
              <textarea id="report-description" rows="3" placeholder="Colors, stickers, scratches, exact room or desk number..."
                class="w-full px-4 py-2 rounded-xl glass-input text-sm focus:outline-none"></textarea>
            </div>
  
            <!-- Drag and Drop Image Intake -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Item Photo (Optional for Vision AI)</label>
              <div class="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 transition-colors"
                   onclick="document.getElementById('report-photo-input').click()">
                <input type="file" id="report-photo-input" accept="image/*" class="hidden" onchange="UniPulse.handlePhotoUploadPreview(this)">
                <div id="photo-preview-container" class="flex flex-col items-center">
                  <svg class="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span class="text-xs text-slate-600 font-medium">Click to upload or drag photo here</span>
                  <span class="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
                </div>
              </div>
            </div>
  
            <div class="pt-2 flex items-center justify-end gap-3">
              <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onclick="UniPulse.closeModal()">
                Cancel
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
                <span>Submit & Match</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  
  // -------------------------------------------------------------------------
  // 2. Flagship 91% AI Match Side-by-Side Analysis Modal
  // -------------------------------------------------------------------------
  async function openMatchAnalysisModal(matchId = 'match-91') {
    const root = getModalRoot();
  
    // Show loading skeleton
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="glass-modal max-w-3xl w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-semibold text-slate-700">Loading AI Multi-Factor Match Analysis...</p>
        </div>
      </div>
    `;
  
    let match;
    try {
      match = await ApiClient.get(`/items/${matchId}/matches`);
    } catch (e) {
      showToast('Could not load match analysis', 'error');
      closeModal();
      return;
    }
  
    const score = match.confidence_score || 91.0;
    const factors = match.match_factors || {};
  
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
        <div class="glass-modal max-w-3xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
          <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
  
          <!-- Header with Confidence Pill -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
                  High Confidence Candidate
                </span>
                <span class="text-xs text-slate-400">Match ID: ${match.id}</span>
              </div>
              <h3 class="text-2xl font-bold text-slate-900">Side-by-Side AI Match Analysis</h3>
            </div>
  
            <!-- Circular Score Badge -->
            <div class="flex items-center gap-3 bg-indigo-50/80 border border-indigo-100 px-4 py-2 rounded-2xl">
              <div class="relative w-12 h-12 flex items-center justify-center">
                <svg class="w-12 h-12" viewBox="0 0 36 36">
                  <path class="text-slate-200" stroke-width="3" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-indigo-600 score-circle" stroke-dasharray="${score}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="absolute text-xs font-black text-indigo-700">${Math.round(score)}%</span>
              </div>
              <div>
                <div class="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Overall Match</div>
                <div class="text-sm font-bold text-indigo-900">${score}% AI Match</div>
              </div>
            </div>
          </div>
  
          <!-- Side-by-Side Comparison Columns -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <!-- Lost Item Card -->
            <div class="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Reported Lost (Yours)</span>
                <span class="text-[11px] text-slate-500">${match.lost_item.date}</span>
              </div>
              <img src="${match.lost_item.image_url}" alt="Lost item" class="w-full h-40 object-cover rounded-xl mb-3 shadow-xs">
              <h4 class="font-bold text-slate-900 text-sm">${match.lost_item.title}</h4>
              <p class="text-xs text-slate-600 mt-1">${match.lost_item.description}</p>
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                <span>Main Library (Level 2)</span>
              </div>
            </div>
  
            <!-- Found Item Card -->
            <div class="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Turned In at Campus Desk</span>
                <span class="text-[11px] text-slate-500">${match.found_item.date}</span>
              </div>
              <img src="${match.found_item.image_url}" alt="Found item" class="w-full h-40 object-cover rounded-xl mb-3 shadow-xs">
              <h4 class="font-bold text-slate-900 text-sm">${match.found_item.title}</h4>
              <p class="text-xs text-slate-600 mt-1">${match.found_item.description}</p>
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                <span>${match.desk_location}</span>
              </div>
            </div>
          </div>
  
          <!-- Explainable Multi-Factor Checklist -->
          <div class="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 mb-6">
            <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Explainable AI Factor Breakdown
            </h5>
  
            <div class="space-y-2.5">
              ${Object.entries(factors).map(([k, f]) => `
                <div class="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</div>
                    <span class="font-medium text-slate-700">${f.description}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] text-slate-400">${Math.round(f.weight * 100)}% wt</span>
                    <span class="font-bold text-slate-900">${f.score}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
  
          <!-- Action Footer -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div class="text-xs text-slate-500">
              Physical Item Location: <strong class="text-slate-800">${match.desk_location}</strong>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <button class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50" onclick="UniPulse.closeModal()">
                Close
              </button>
              ${match.status === 'claimed' ? `
                <span class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Claim Dispatched to Desk</span>
                </span>
              ` : `
                <button class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                        onclick="UniPulse.handleClaimDispatch('${match.id}')">
                  <span>Dispatch Claim to Desk</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // -------------------------------------------------------------------------
  // 3. Instant Desk Reservation Modal
  // -------------------------------------------------------------------------
  function openReserveModal(spaceId, spaceName) {
    const root = getModalRoot();
  
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="glass-modal max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
  
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-900">Reserve Study Desk</h3>
              <p class="text-xs text-slate-500">${spaceName}</p>
            </div>
          </div>
  
          <form onsubmit="UniPulse.handleReserveSubmit(event, '${spaceId}')" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Select Desk Number</label>
              <select id="reserve-desk-select" class="w-full px-3 py-2.5 rounded-xl glass-input text-sm focus:outline-none font-mono">
                <option value="D-102">Desk D-102 (Window / Dual Power)</option>
                <option value="D-104">Desk D-104 (Quiet Corner / Power)</option>
                <option value="D-109">Desk D-109 (Center Cubicle / Lamp)</option>
                <option value="D-115">Desk D-115 (Standing Desk Option)</option>
              </select>
            </div>
  
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Reservation Window</label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" class="duration-pill active py-2 rounded-xl border border-indigo-600 bg-indigo-50 text-indigo-700 text-xs font-bold" onclick="UniPulse.selectDuration(this, 30)">30 Mins</button>
                <button type="button" class="duration-pill py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300" onclick="UniPulse.selectDuration(this, 45)">45 Mins</button>
                <button type="button" class="duration-pill py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300" onclick="UniPulse.selectDuration(this, 60)">60 Mins</button>
              </div>
              <input type="hidden" id="reserve-duration" value="30">
            </div>
  
            <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-slate-600">
              <svg class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Pass holds desk for 15 minutes past start time before releasing to waiting students.</span>
            </div>
  
            <div class="pt-2 flex items-center justify-end gap-3">
              <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50" onclick="UniPulse.closeModal()">
                Cancel
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
                <span>Issue Digital Pass</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  
  // -------------------------------------------------------------------------
  // 4. Global Command Palette (⌘K / Ctrl+K)
  // -------------------------------------------------------------------------
  function openCommandPalette() {
    const root = getModalRoot();
  
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onclick="if(event.target === this) UniPulse.closeModal()">
        <div class="glass-modal max-w-xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh]">
          <!-- Search Input Bar -->
          <div class="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
            <svg class="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input id="cmd-k-input" type="text" placeholder="Type a command, building, or search campus items..."
                   class="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                   oninput="UniPulse.handleCommandSearch(this.value)">
            <kbd class="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">ESC</kbd>
          </div>
  
          <!-- Search Results List -->
          <div id="cmd-k-results" class="p-2 overflow-y-auto space-y-1">
            <!-- Initial Quick Actions -->
            <div class="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</div>
            <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors text-left group" onclick="UniPulse.navigateTo('spaces'); UniPulse.closeModal()">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">⚡</div>
                <div>
                  <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-900">Reserve Quiet Study Desk</div>
                  <div class="text-[11px] text-slate-400">Main Library Level 3 or Block 34</div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Spaces</span>
            </button>
  
            <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 transition-colors text-left group" onclick="UniPulse.openReportModal('lost');">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">🔍</div>
                <div>
                  <div class="text-xs font-semibold text-slate-800 group-hover:text-amber-900">Report Lost Belonging</div>
                  <div class="text-[11px] text-slate-400">Submit photos and run AI matching</div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Lost & Found</span>
            </button>
  
            <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors text-left group" onclick="UniPulse.navigateTo('campusMap'); UniPulse.closeModal()">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">🗺️</div>
                <div>
                  <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-900">Interactive Campus Map</div>
                  <div class="text-[11px] text-slate-400">Walking routes, hours, and facilities</div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Finder</span>
            </button>
          </div>
        </div>
      </div>
    `;
  
    setTimeout(() => {
      const input = document.getElementById('cmd-k-input');
      if (input) input.focus();
    }, 50);
  }

  // --- Source: js/components/sidebar.js ---
  // =========================================================================
  // UniPulse Sidebar Navigation & Role Switcher
  // =========================================================================
  
  function renderSidebar() {
    const current = AppState.activeView;
    const isAdmin = AppState.user.role === 'admin';
  
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>' },
      { id: 'assistant', label: 'AI Assistant', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>', badge: 'AI Live' },
      { id: 'campusMap', label: 'Campus Finder', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>' },
      { id: 'lostFound', label: 'Lost & Found', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>', badge: '91% Match' },
      { id: 'spaces', label: 'Live Study Spaces', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>' },
      { id: 'events', label: 'Campus Events', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
      { id: 'profile', label: 'Student Profile', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' }
    ];
  
    if (isAdmin) {
      navItems.push({
        id: 'admin',
        label: 'Admin Console',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
        badge: 'Staff'
      });
    }
  
    return `
      <aside class="w-64 flex-shrink-0 glass-sidebar flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
        <!-- Top Brand Header -->
        <div class="p-6">
          <div class="flex items-center gap-3 cursor-pointer" onclick="UniPulse.navigateTo('dashboard')">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <span class="text-xl font-extrabold tracking-tight text-slate-900">Uni<span class="text-indigo-600">Pulse</span></span>
              <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Campus Companion</div>
            </div>
          </div>
  
          <!-- Navigation Links -->
          <nav class="mt-8 space-y-1">
            ${navItems.map(item => {
              const isActive = current === item.id;
              return `
                <button onclick="UniPulse.navigateTo('${item.id}')"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-700 shadow-xs border border-indigo-600/20 backdrop-blur-sm'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }">
                  <div class="flex items-center gap-3">
                    <span class="${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}">
                      ${item.icon}
                    </span>
                    <span>${item.label}</span>
                  </div>
                  ${item.badge ? `
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badge.includes('91%') ? 'bg-amber-100 text-amber-800' :
                      item.badge.includes('Staff') ? 'bg-purple-100 text-purple-700' :
                      'bg-indigo-100 text-indigo-700'
                    }">
                      ${item.badge}
                    </span>
                  ` : ''}
                </button>
              `;
            }).join('')}
          </nav>
        </div>
  
        <!-- Bottom User Profile Card & Role Switcher -->
        <div class="p-4 border-t border-white/60 bg-white/40 backdrop-blur-md">
          <!-- Role Switcher Button -->
          <button onclick="UniPulse.toggleRole()"
                  class="w-full mb-3 px-3 py-2 rounded-xl text-xs font-bold border border-white/80 bg-white/70 hover:bg-white/90 text-slate-700 shadow-2xs flex items-center justify-between transition-all backdrop-blur-sm">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-emerald-500'}"></span>
              <span>Role: ${isAdmin ? 'Administrator' : 'Student'}</span>
            </span>
            <span class="text-[10px] text-indigo-600 underline">Switch</span>
          </button>
  
          <div class="flex items-center gap-3 p-2 rounded-xl bg-white/70 border border-white/80 shadow-2xs backdrop-blur-sm">
            <img src="${AppState.user.avatar_url}" alt="Profile" class="w-9 h-9 rounded-xl object-cover border border-slate-200">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-slate-900 truncate">${AppState.user.name}</div>
              <div class="text-[11px] text-slate-400 truncate">${AppState.user.major}</div>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  // --- Source: js/components/header.js ---
  // =========================================================================
  // UniPulse Top Navigation Bar: Search trigger, beacon, notifications
  // =========================================================================
  
  function renderHeader() {
    return `
      <header class="h-16 glass-header sticky top-0 z-20 px-6 flex items-center justify-between">
        <!-- Left: Campus Beacon & Breadcrumbs -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 beacon-pulse"></span>
            <span>Main Campus Online</span>
          </div>
          <span class="hidden sm:inline text-xs text-slate-400 font-medium">• Term Fall '26</span>
        </div>
  
        <!-- Center: ⌘K Global Search Trigger Bar -->
        <div class="flex-1 max-w-md mx-6">
          <div onclick="UniPulse.openCommandPalette()"
               class="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/80 text-slate-500 text-xs font-medium cursor-pointer transition-all shadow-xs backdrop-blur-sm">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>Search spaces, routes, lost belongings...</span>
            </div>
            <kbd class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white/90 rounded-lg border border-slate-200 shadow-2xs">
              <span>⌘</span><span>K</span>
            </kbd>
          </div>
        </div>
  
        <!-- Right: Action Buttons & Notifications -->
        <div class="flex items-center gap-3">
          <!-- Notification Bell -->
          <div class="relative">
            <button class="w-9 h-9 rounded-xl border border-white/80 bg-white/60 hover:bg-white/90 flex items-center justify-center text-slate-600 transition-all shadow-xs backdrop-blur-sm relative"
                    onclick="UniPulse.toggleNotificationFlyout()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              ${AppState.unreadNotifications > 0 ? `
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                  ${AppState.unreadNotifications}
                </span>
              ` : ''}
            </button>
  
            <!-- Notifications Dropdown -->
            <div id="notification-flyout" class="hidden absolute right-0 mt-2 w-80 glass-modal rounded-2xl shadow-xl p-3.5 z-50 animate-fadeIn">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span class="text-xs font-bold text-slate-800">Campus Alerts</span>
                <span class="text-[10px] text-indigo-600 font-semibold cursor-pointer" onclick="UniPulse.clearNotifications()">Mark all read</span>
              </div>
              <div class="space-y-2">
                <div class="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 cursor-pointer" onclick="UniPulse.openMatchAnalysisModal('match-91')">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-bold text-indigo-900">91% Match Detected</span>
                    <span class="text-[9px] text-slate-400">10m ago</span>
                  </div>
                  <p class="text-[11px] text-slate-600">Your lost Hydro Flask 32oz has a candidate match at the Library.</p>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-bold text-slate-800">Hackathon RSVP</span>
                    <span class="text-[9px] text-slate-400">1h ago</span>
                  </div>
                  <p class="text-[11px] text-slate-600">You're confirmed for Campus AI Hackathon 2026 this Friday.</p>
                </div>
              </div>
            </div>
          </div>
  
          <!-- User Mini Avatar -->
          <div class="cursor-pointer" onclick="UniPulse.navigateTo('profile')">
            <img src="${AppState.user.avatar_url}" alt="User avatar"
                 class="w-9 h-9 rounded-xl object-cover border border-slate-200 ring-2 ring-indigo-50 hover:ring-indigo-200 transition-all">
          </div>
        </div>
      </header>
    `;
  }

  // --- Source: js/views/dashboard.js ---
  // =========================================================================
  // UniPulse Dashboard View: Rotating AI Hero Search, 91% Match Card, Snapshot
  // =========================================================================
  
  function renderDashboard() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Top Welcome Greeting -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span class="text-indigo-600">${AppState.user.name.split(' ')[0]}</span> 👋
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Here is what is happening across your campus right now.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="UniPulse.openReportModal('lost')"
                    class="px-4 py-2 rounded-xl glass-card glass-card-hover text-xs font-semibold text-slate-700 shadow-xs transition-all flex items-center gap-1.5">
              <span class="text-amber-500">●</span>
              <span>Lost Something?</span>
            </button>
            <button onclick="UniPulse.openReportModal('found')"
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5">
              <span class="text-white">+</span>
              <span>Found Item</span>
            </button>
          </div>
        </div>
  
        <!-- AI Hero Search Section with Rotating Suggestion -->
        <div class="bg-gradient-to-br from-indigo-950/90 via-indigo-900/85 to-slate-950/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-white/20">
          <div class="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-12 -top-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4 backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-indigo-400 beacon-pulse"></span>
              <span>AI Campus Intelligence</span>
            </div>
            <h2 class="text-xl sm:text-3xl font-bold tracking-tight mb-3">Ask UniPulse anything on campus</h2>
            <p class="text-xs sm:text-sm text-indigo-200/80 mb-6">Real-time answers for study spots, campus routes, lost belongings, and events.</p>
  
            <!-- Rotating Input Bar -->
            <div class="bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl p-2 flex items-center gap-2 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-white/40 transition-all">
              <div class="pl-3 text-indigo-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input id="hero-ai-search" type="text"
                     placeholder="40 mins free: where to study quietly?"
                     class="w-full bg-transparent text-white placeholder-indigo-200/60 text-sm focus:outline-none px-2"
                     onkeydown="if(event.key === 'Enter') UniPulse.handleHeroSearch(this.value)">
              <button onclick="UniPulse.handleHeroSearch(document.getElementById('hero-ai-search').value)"
                      class="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-md flex-shrink-0 flex items-center gap-1.5">
                <span>Ask AI</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
  
            <!-- Suggested Prompt Chips -->
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <button onclick="UniPulse.triggerAssistantPrompt('40 mins free: where to study quietly?')"
                      class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-all backdrop-blur-md shadow-xs">
                💡 40 mins free: where to study quietly?
              </button>
              <button onclick="UniPulse.triggerAssistantPrompt('How do I walk from Block 34 to Sports Complex?')"
                      class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-all backdrop-blur-md shadow-xs">
                🗺️ Route to Sports Complex
              </button>
              <button onclick="UniPulse.triggerAssistantPrompt('Upcoming campus hackathons this week')"
                      class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-100 transition-all backdrop-blur-md shadow-xs">
                🎉 Tech Hackathons
              </button>
            </div>
          </div>
        </div>
  
        <!-- Proactive AI Match Banner (91% Confidence Match) -->
        <div id="dashboard-proactive-match" class="glass-card glass-card-hover border border-indigo-500/30 rounded-3xl p-6 shadow-card transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div class="flex items-start gap-4">
            <!-- Circular Score Badge -->
            <div class="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-indigo-600/10 rounded-2xl border border-indigo-600/20 backdrop-blur-sm">
              <svg class="w-14 h-14" viewBox="0 0 36 36">
                <path class="text-slate-200/80" stroke-width="3" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-indigo-600 score-circle" stroke-dasharray="91, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="absolute text-xs font-black text-indigo-700">91%</span>
            </div>
  
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Candidate Matched
                </span>
                <span class="text-xs text-slate-400 font-medium">Auto-detected 15m ago</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900">Hydro Flask Navy Blue 32oz</h3>
              <p class="text-xs text-slate-600 mt-0.5">
                Turned in at <strong>Main Library Information Desk</strong> matches your reported lost bottle with 91.2% multi-factor confidence.
              </p>
            </div>
          </div>
  
          <div class="flex items-center gap-3 w-full md:w-auto">
            <button onclick="UniPulse.openMatchAnalysisModal('match-91')"
                    class="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2">
              <span>View 91% AI Match</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
  
        <!-- Campus Snapshot Grid: Study Spaces & Campus Events -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Live Study Spaces Quick Card -->
          <div class="glass-card rounded-3xl p-6 shadow-card">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">📚</div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Live Study Spaces</h3>
                  <div class="text-[11px] text-slate-400">Real-time occupancy meters</div>
                </div>
              </div>
              <button onclick="UniPulse.navigateTo('spaces')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All →</button>
            </div>
  
            <div class="space-y-3" id="dashboard-spaces-list">
              <div class="p-3.5 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/80 backdrop-blur-sm flex items-center justify-between transition-all shadow-2xs">
                <div>
                  <div class="text-xs font-bold text-slate-900">Main Library — Level 3</div>
                  <div class="text-[11px] text-slate-500">Silent Focus • 26 Open Desks</div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">78% Full</span>
                  <button onclick="UniPulse.openReserveModal('space-1', 'Main Library — Level 3')" class="block mt-1 text-[11px] font-bold text-indigo-600 hover:underline">Reserve Desk</button>
                </div>
              </div>
  
              <div class="p-3.5 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/80 backdrop-blur-sm flex items-center justify-between transition-all shadow-2xs">
                <div>
                  <div class="text-xs font-bold text-slate-900">Block 34 — Turing Commons</div>
                  <div class="text-[11px] text-slate-500">Moderate • 49 Open Desks</div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">42% Full</span>
                  <button onclick="UniPulse.openReserveModal('space-2', 'Block 34 — Turing Commons')" class="block mt-1 text-[11px] font-bold text-indigo-600 hover:underline">Reserve Desk</button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Campus Events & Hackathons Quick Card -->
          <div class="glass-card rounded-3xl p-6 shadow-card">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">🎉</div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Recommended For You</h3>
                  <div class="text-[11px] text-slate-400">Matched to B.S. Computer Science</div>
                </div>
              </div>
              <button onclick="UniPulse.navigateTo('events')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View Events →</button>
            </div>
  
            <div class="space-y-3" id="dashboard-events-list">
              <div class="p-3.5 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/80 backdrop-blur-sm flex items-center justify-between transition-all shadow-2xs">
                <div>
                  <div class="text-xs font-bold text-slate-900">Campus AI & Coding Hackathon 2026</div>
                  <div class="text-[11px] text-slate-500">This Friday • Block 34 Innovation Lab</div>
                </div>
                <button onclick="UniPulse.handleRSVPToggle('ev-1', this)" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                  ✓ RSVP'd
                </button>
              </div>
  
              <div class="p-3.5 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/80 backdrop-blur-sm flex items-center justify-between transition-all shadow-2xs">
                <div>
                  <div class="text-xs font-bold text-slate-900">Autonomous Drone & Robotics Workshop</div>
                  <div class="text-[11px] text-slate-500">Saturday 2:00 PM • Robotics Arena</div>
                </div>
                <button onclick="UniPulse.handleRSVPToggle('ev-2', this)" class="px-3 py-1.5 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-colors">
                  RSVP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/assistant.js ---
  // =========================================================================
  // UniPulse AI Assistant View: Streaming cards & Right Context Panel sync
  // =========================================================================
  
  function renderAssistant() {
    return `
      <div class="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-fadeIn pb-4">
        <!-- Left / Center: Conversational Chat Interface -->
        <div class="flex-1 glass-card rounded-3xl shadow-card flex flex-col overflow-hidden">
          <!-- Chat Header -->
          <div class="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
                🤖
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">UniPulse AI Campus Assistant</h3>
                <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 beacon-pulse"></span>
                  <span>Claude Campus Engine Online</span>
                </div>
              </div>
            </div>
            <button onclick="UniPulse.clearAssistantChat()" class="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-lg">
              Clear Chat
            </button>
          </div>
  
          <!-- Chat Stream Messages Container -->
          <div id="assistant-chat-stream" class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            <!-- Initial Assistant Greeting -->
            <div class="flex items-start gap-3 max-w-2xl">
              <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div class="space-y-3">
                <div class="p-4 rounded-2xl rounded-tl-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed shadow-xs">
                  Hello Alex! I am your UniPulse AI Campus Assistant. Ask me about quiet study desks, walking routes across buildings, lost belongings, or recommended hackathons.
                </div>
  
                <!-- Suggested starter prompts -->
                <div class="flex flex-wrap gap-2 text-xs">
                  <button onclick="UniPulse.sendAssistantMessage('Where is the quietest study spot with power outlets right now?')"
                          class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                    📚 Quiet study desks right now
                  </button>
                  <button onclick="UniPulse.sendAssistantMessage('How do I walk from Block 34 to Sports Complex?')"
                          class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                    🗺️ Walking route: Block 34 to Sports
                  </button>
                  <button onclick="UniPulse.sendAssistantMessage('Check my lost Hydro Flask match status')"
                          class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                    🔍 Lost bottle match status
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Chat Input Bar -->
          <div class="p-4 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
            <form onsubmit="UniPulse.handleAssistantSubmit(event)" class="flex items-center gap-2">
              <input id="assistant-input" type="text"
                     placeholder="Ask anything about campus, study spaces, routes..."
                     class="flex-1 px-4 py-3 rounded-2xl glass-input text-sm">
              <button type="submit"
                      class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5">
                <span>Send</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </form>
          </div>
        </div>
  
        <!-- Right: Dynamic Synchronized Context Panel -->
        <div id="right-context-panel" class="w-full lg:w-80 glass-card rounded-3xl shadow-card p-6 flex flex-col justify-between overflow-y-auto">
          <!-- Default Context View -->
          <div>
            <div class="flex items-center gap-2 pb-3 border-b border-white/20 dark:border-white/10 mb-4">
              <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Right Context Panel</h4>
            </div>
  
            <div id="context-panel-content" class="space-y-4">
              <div class="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 backdrop-blur-sm">
                <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Proactive Sync</span>
                <h5 class="text-sm font-bold text-slate-900 mt-1">Live Context Follows Chat</h5>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                  When the assistant mentions study spaces, buildings, or lost items, interactive cards and quick actions appear here automatically.
                </p>
              </div>
  
              <!-- Featured Quick Action: Library Level 3 -->
              <div class="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-900">Main Library — Level 3</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Silent Focus</span>
                </div>
                <div class="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden my-2">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: 78%"></div>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <span>78% Occupied</span>
                  <span>26 Open Desks</span>
                </div>
                <button onclick="UniPulse.openReserveModal('space-1', 'Main Library — Level 3')"
                        class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors">
                  Quick Reserve Desk
                </button>
              </div>
            </div>
          </div>
  
          <div class="pt-4 border-t border-white/20 dark:border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Synced with UniPulse Session</span>
            <span class="font-mono text-indigo-600 font-semibold">ID: ${AppState.assistantSessionId.substring(0, 8)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/campusMap.js ---
  // =========================================================================
  // UniPulse Campus Finder: Vector SVG Map & Animated Walking Route Polyline
  // =========================================================================
  
  function renderCampusMap() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Top Title & Route Selection Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Campus Finder</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Live pedestrian routes, facility hours, and SVG vector navigation.</p>
          </div>
  
          <!-- Quick Route Selector -->
          <div class="glass-card p-2 rounded-2xl flex items-center gap-2">
            <div class="flex items-center gap-1.5 text-xs text-slate-700 font-semibold px-2">
              <span>From:</span>
              <select id="route-from-select" class="glass-input rounded-lg px-2 py-1 text-xs focus:outline-none" onchange="UniPulse.updateMapRoute()">
                <option value="b34">Block 34 (Engineering)</option>
                <option value="lib">Main Library</option>
                <option value="sc">Student Commons</option>
                <option value="inn">Innovation Hub</option>
              </select>
            </div>
            <span class="text-slate-400">→</span>
            <div class="flex items-center gap-1.5 text-xs text-slate-700 font-semibold px-2">
              <span>To:</span>
              <select id="route-to-select" class="glass-input rounded-lg px-2 py-1 text-xs focus:outline-none" onchange="UniPulse.updateMapRoute()">
                <option value="sport" selected>Sports Complex</option>
                <option value="lib">Main Library</option>
                <option value="b34">Block 34</option>
                <option value="sc">Student Commons</option>
              </select>
            </div>
            <button onclick="UniPulse.updateMapRoute()"
                    class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95">
              Route
            </button>
          </div>
        </div>
  
        <!-- Main Map Grid (SVG Map Canvas + Directory Details) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- SVG Vector Campus Canvas (2 cols) -->
          <div class="lg:col-span-2 bg-slate-900/95 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/10 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
            <!-- Map Overlay HUD -->
            <div class="absolute top-6 left-6 z-10 flex items-center gap-3">
              <div class="px-3 py-1.5 rounded-full bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 beacon-pulse"></span>
                <span>Vector Campus Layer</span>
              </div>
              <div id="route-metric-pill" class="px-3 py-1.5 rounded-full bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white text-xs font-bold">
                670m • ~8 min walk
              </div>
            </div>
  
            <!-- Interactive SVG Map -->
            <div class="w-full h-full flex items-center justify-center p-2">
              <svg id="campus-svg-canvas" viewBox="0 0 900 600" class="w-full h-full max-h-[520px] select-none">
                <defs>
                  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0F172A" />
                    <stop offset="100%" stop-color="#1E293B" />
                  </linearGradient>
                  <linearGradient id="greenLawn" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#064E3B" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#047857" stop-opacity="0.3" />
                  </linearGradient>
                </defs>
  
                <!-- Map Background -->
                <rect width="900" height="600" fill="url(#bgGrad)" rx="24" />
  
                <!-- Campus Green Lawns / Landscape -->
                <path d="M 120 120 Q 320 80 500 130 T 800 240 L 760 520 Q 450 560 220 500 Z" fill="url(#greenLawn)" />
  
                <!-- Campus Walkway Grid (Dashed background paths) -->
                <path d="M 180 190 L 300 260 L 460 240 L 480 340 L 610 340 L 720 380" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />
                <path d="M 300 260 L 420 420 L 480 340" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />
                <path d="M 300 260 L 260 480 L 420 420" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />
  
                <!-- Active Animated Route Polyline Layer -->
                <path id="svg-animated-route-line"
                      d="M 180,190 L 300,260 L 460,240 L 480,340 L 610,340 L 720,380"
                      class="animated-route"
                      fill="none" />
  
                <!-- Campus Buildings (Nodes) -->
                <!-- 1. Block 34 (Engineering & CS) -->
                <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('b34')">
                  <rect x="130" y="140" width="100" height="90" rx="14" fill="#1E1B4B" stroke="#6366F1" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                  <text x="180" y="180" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Block 34</text>
                  <text x="180" y="202" fill="#818CF8" font-size="11" text-anchor="middle">Eng & CS</text>
                  <circle cx="180" cy="190" r="4" fill="#6366F1" />
                </g>
  
                <!-- 2. Main Library -->
                <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('lib')">
                  <rect x="400" y="190" width="120" height="95" rx="14" fill="#1E1B4B" stroke="#4F46E5" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                  <text x="460" y="235" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Main Library</text>
                  <text x="460" y="255" fill="#818CF8" font-size="11" text-anchor="middle">Quiet Zones</text>
                  <circle cx="460" cy="240" r="4" fill="#4F46E5" />
                </g>
  
                <!-- 3. Sports & Recreation Complex -->
                <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('sport')">
                  <rect x="660" y="325" width="120" height="100" rx="14" fill="#1E1B4B" stroke="#EC4899" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                  <text x="720" y="370" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Sports Complex</text>
                  <text x="720" y="392" fill="#F472B6" font-size="11" text-anchor="middle">Pool & Gym</text>
                  <circle cx="720" cy="380" r="4" fill="#EC4899" />
                </g>
  
                <!-- 4. Student Commons & Dining -->
                <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('sc')">
                  <rect x="360" y="375" width="120" height="90" rx="14" fill="#1E1B4B" stroke="#10B981" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                  <text x="420" y="415" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Commons</text>
                  <text x="420" y="435" fill="#34D399" font-size="11" text-anchor="middle">Dining & Lounge</text>
                  <circle cx="420" cy="420" r="4" fill="#10B981" />
                </g>
  
                <!-- 5. Innovation Hub -->
                <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('inn')">
                  <rect x="200" y="435" width="115" height="90" rx="14" fill="#1E1B4B" stroke="#F59E0B" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                  <text x="257" y="475" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Innovation Hub</text>
                  <text x="257" y="495" fill="#FCD34D" font-size="11" text-anchor="middle">Makers & Labs</text>
                  <circle cx="260" cy="480" r="4" fill="#F59E0B" />
                </g>
              </svg>
            </div>
  
            <!-- Bottom Legend -->
            <div class="flex items-center justify-between text-[11px] text-slate-400 px-4 py-2 bg-slate-800/60 rounded-2xl border border-slate-700">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Academic & Tech</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Student Life</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Athletics</span>
              </div>
              <span>Click any building or node for details</span>
            </div>
          </div>
  
          <!-- Right Side: Building Directory & Step-by-Step Directions -->
          <div class="space-y-6">
            <!-- Active Building / Route Details Card -->
            <div id="map-directory-details" class="glass-card rounded-3xl p-6 shadow-card">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Active Destination</span>
                  <h3 class="text-lg font-bold text-slate-900 mt-1">Sports & Recreation Complex</h3>
                </div>
                <div class="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold text-lg border border-pink-500/20">
                  🏀
                </div>
              </div>
  
              <p class="text-xs text-slate-600 leading-relaxed">
                Olympic swimming pool, indoor courts, climbing gym, and outdoor athletic track.
              </p>
  
              <div class="my-4 p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-white/5 space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Hours:</span>
                  <span class="font-bold text-slate-800">6:00 AM - 10:00 PM</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Transit from B34:</span>
                  <span class="font-bold text-indigo-600">~8 mins (670 meters)</span>
                </div>
              </div>
  
              <!-- Step-by-Step Directions -->
              <div class="space-y-2">
                <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Turn-by-Turn Path</h5>
                <div class="space-y-2 text-xs text-slate-600">
                  <div class="flex items-start gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                    <span>Exit Block 34 main concourse heading east toward Central Lawn</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                    <span>Pass Main Library courtyard fountain</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                    <span>Continue along shaded walkway into Sports Complex lobby</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/lostFound.js ---
  // =========================================================================
  // UniPulse Smart Lost & Found: Intake CTAs, Live Feed, 91% AI Match Hub
  // =========================================================================
  
  function renderLostFound() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Top Title & Intake Action CTAs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Smart Lost & Found</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Computer vision matching, explainable factor analysis, and safe desk claim dispatch.</p>
          </div>
  
          <div class="flex items-center gap-3">
            <button onclick="UniPulse.openReportModal('lost')"
                    class="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2">
              <span>🔍 I Lost Something</span>
            </button>
            <button onclick="UniPulse.openReportModal('found')"
                    class="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
              <span>+ I Found Something</span>
            </button>
          </div>
        </div>
  
        <!-- Flagship 91% AI Match Hero Callout Card -->
        <div class="bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-indigo-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/20">
          <div class="flex items-start gap-4">
            <div class="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
              <svg class="w-14 h-14" viewBox="0 0 36 36">
                <path class="text-white/20" stroke-width="3" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-emerald-400 score-circle" stroke-dasharray="91, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="absolute text-xs font-black text-emerald-300">91%</span>
            </div>
  
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-1">
                <span>● Proactive AI Match Candidate</span>
              </div>
              <h3 class="text-lg sm:text-xl font-bold">Hydro Flask Navy Blue 32oz Match Detected</h3>
              <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Our vision and proximity matching engine paired your lost report with an insulated bottle turned in at the <strong>Main Library Ground Desk</strong>.
              </p>
            </div>
          </div>
  
          <button onclick="UniPulse.openMatchAnalysisModal('match-91')"
                  class="px-6 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 text-xs font-bold shadow-lg transition-all flex items-center gap-2 flex-shrink-0">
            <span>Inspect 91% Match</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
  
        <!-- Feed Controls: Filters & Search -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button onclick="UniPulse.filterLostItems('all', this)" class="item-filter-tab active px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600/15 text-indigo-700 border border-indigo-600/30 backdrop-blur-md shadow-2xs">
              All Items
            </button>
            <button onclick="UniPulse.filterLostItems('lost', this)" class="item-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
              Lost
            </button>
            <button onclick="UniPulse.filterLostItems('found', this)" class="item-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
              Found
            </button>
            <button onclick="UniPulse.filterLostItems('matched', this)" class="item-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
              Matched (91%)
            </button>
          </div>
  
          <div class="text-xs text-slate-400 font-medium">
            Showing real items persisted in SQLite
          </div>
        </div>
  
        <!-- Items Grid (Dynamically Populated) -->
        <div id="lost-items-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Skeleton / populated by app.js -->
          <div class="p-8 text-center col-span-3 text-slate-400 text-xs">Loading items feed...</div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/spaces.js ---
  // =========================================================================
  // UniPulse Live Study Spaces: Real-time Occupancy Meters & Instant Booking
  // =========================================================================
  
  function renderSpaces() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Top Title & Live SSE Beacon -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Live Study Spaces</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Real-time seat occupancy meters, acoustic noise atmosphere, and 45-min desk passes.</p>
          </div>
  
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 beacon-pulse"></span>
            <span>Realtime Occupancy Channel Active</span>
          </div>
        </div>
  
        <!-- Noise Atmosphere Filter Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <button onclick="UniPulse.filterSpaces('all', this)" class="space-filter-tab active px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600/15 text-indigo-700 border border-indigo-600/30 backdrop-blur-md shadow-2xs">
            All Spaces
          </button>
          <button onclick="UniPulse.filterSpaces('Silent Focus', this)" class="space-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
            Silent Focus
          </button>
          <button onclick="UniPulse.filterSpaces('Quiet', this)" class="space-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
            Quiet Pods
          </button>
          <button onclick="UniPulse.filterSpaces('Moderate', this)" class="space-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
            Moderate
          </button>
          <button onclick="UniPulse.filterSpaces('Collaborative', this)" class="space-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-white/80 transition-all">
            Collaborative Lounge
          </button>
        </div>
  
        <!-- Spaces Cards Grid -->
        <div id="study-spaces-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Rendered dynamically by app.js from ApiClient.get('/study-spaces') -->
          <div class="p-8 text-center col-span-2 text-slate-400 text-xs">Loading live spaces data...</div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/events.js ---
  // =========================================================================
  // UniPulse Campus Events & Hackathons Discovery View
  // =========================================================================
  
  function renderEvents() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Campus Events & Hackathons</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Personalized recommendations tailored to your Computer Science academic profile.</p>
          </div>
        </div>
  
        <!-- Category Filter Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <button onclick="UniPulse.filterEvents('all', this)" class="event-filter-tab glass-pill active px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400">
            All Events
          </button>
          <button onclick="UniPulse.filterEvents('Tech', this)" class="event-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            Tech & AI
          </button>
          <button onclick="UniPulse.filterEvents('Engineering', this)" class="event-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            Engineering & Robotics
          </button>
          <button onclick="UniPulse.filterEvents('Workshops', this)" class="event-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            Workshops
          </button>
          <button onclick="UniPulse.filterEvents('Cultural', this)" class="event-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cultural & Social
          </button>
        </div>
  
        <!-- Events Cards Grid -->
        <div id="events-feed-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Rendered dynamically by app.js from ApiClient.get('/events') -->
          <div class="p-8 text-center col-span-2 text-slate-400 text-xs">Loading campus events...</div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/profile.js ---
  // =========================================================================
  // UniPulse Student Profile & Preferences View
  // =========================================================================
  
  function renderProfile() {
    const u = AppState.user;
  
    return `
      <div class="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        <!-- Profile Header Card -->
        <div class="glass-card rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div class="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-5 relative z-10">
            <img src="${u.avatar_url}" alt="Student Avatar" class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-extrabold text-slate-900">${u.name}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  ${u.role}
                </span>
              </div>
              <p class="text-sm font-semibold text-slate-600 mt-0.5">${u.major} • Class of ${u.grad_year}</p>
              <p class="text-xs text-slate-400 mt-1">Student ID: <span class="font-mono font-bold text-slate-700">${u.student_id}</span> • ${u.email}</p>
            </div>
          </div>
  
          <button onclick="UniPulse.toggleRole()"
                  class="relative z-10 px-4 py-2 rounded-xl glass-pill text-xs font-bold text-slate-700 transition-all shadow-2xs hover:border-indigo-300">
            Switch to ${u.role === 'admin' ? 'Student' : 'Admin'} Mode
          </button>
        </div>
  
        <!-- Academic Interests & Recommendation Personalization -->
        <div class="glass-card rounded-3xl p-6 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Personalized Academic Interests</h3>
              <p class="text-xs text-slate-500">Powers your AI assistant and personalized event recommendations</p>
            </div>
            <span class="text-xs text-indigo-600 font-semibold">4 Active Tags</span>
          </div>
  
          <div id="profile-interest-tags" class="flex flex-wrap gap-2 mb-4">
            ${(u.interests || []).map(tag => `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-700 text-xs font-semibold backdrop-blur-xs">
                <span>${tag}</span>
                <button onclick="UniPulse.removeInterest('${tag}')" class="text-indigo-400 hover:text-indigo-800">×</button>
              </span>
            `).join('')}
          </div>
  
          <!-- Add Tag Input -->
          <form onsubmit="UniPulse.handleAddInterest(event)" class="flex items-center gap-2 max-w-sm">
            <input id="new-interest-input" type="text" placeholder="Add interest (e.g. Design, Quantum)..."
                   class="flex-1 px-3 py-2 rounded-xl glass-input text-xs focus:outline-none">
            <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
          </form>
        </div>
  
        <!-- Activity Timeline: Active Passes & Reports -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Active Passes -->
          <div class="glass-card rounded-3xl p-6 shadow-card">
            <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🎟️</span>
              <span>Active Desk Passes</span>
            </h3>
            <div id="profile-active-passes" class="space-y-3">
              <div class="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">Main Library — Desk D-102</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1 font-mono">Pass: PASS-91B24A • Valid for 45 mins</div>
              </div>
            </div>
          </div>
  
          <!-- Submitted Reports -->
          <div class="glass-card rounded-3xl p-6 shadow-card">
            <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>📦</span>
              <span>Your Campus Reports</span>
            </h3>
            <div id="profile-submitted-reports" class="space-y-3">
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">Hydro Flask Navy Blue 32oz</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">91% Matched</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Lost at Main Library Level 2 • Ready for Desk Pickup</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Source: js/views/admin.js ---
  // =========================================================================
  // UniPulse Admin Console: Campus KPIs, Velocity Charts, Staff Audit Queue
  // =========================================================================
  
  function renderAdmin() {
    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Top Title & Badge -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                Staff Clearance Active
              </span>
              <span class="text-xs text-slate-400">Lead: Dr. Sarah Chen</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Operations Administration Console</h1>
          </div>
  
          <button onclick="UniPulse.toggleRole()"
                  class="px-4 py-2 rounded-xl glass-pill text-xs font-bold text-slate-700 shadow-2xs hover:border-indigo-300">
            Return to Student View
          </button>
        </div>
  
        <!-- Campus KPI Highlights Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card glass-card-hover p-5 rounded-3xl">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</div>
            <div id="admin-kpi-students" class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">14,820</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>↑ 8.4%</span>
              <span class="text-slate-400">vs last term</span>
            </div>
          </div>
  
          <div class="glass-card glass-card-hover p-5 rounded-3xl">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Match Accuracy</div>
            <div id="admin-kpi-accuracy" class="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">94.2%</div>
            <div class="text-[11px] text-indigo-500 font-semibold mt-1">Computer vision & spatial</div>
          </div>
  
          <div class="glass-card glass-card-hover p-5 rounded-3xl">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Lost Reports</div>
            <div id="admin-kpi-reports" class="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">42</div>
            <div class="text-[11px] text-slate-500 font-medium mt-1">19 awaiting candidate pairs</div>
          </div>
  
          <div class="glass-card glass-card-hover p-5 rounded-3xl">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved This Week</div>
            <div id="admin-kpi-resolved" class="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">89</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1">Avg 3.4h resolution speed</div>
          </div>
        </div>
  
        <!-- Velocity Chart & Study Space Capacity Distribution -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Resolution Velocity SVG Chart (2 cols) -->
          <div class="lg:col-span-2 glass-card p-6 rounded-3xl shadow-card">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Weekly Lost & Found Resolution Velocity</h3>
                <p class="text-xs text-slate-400">Daily intake vs confirmed student claim handoffs</p>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Resolved</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Reported</span>
              </div>
            </div>
  
            <!-- SVG Bar Chart -->
            <div id="admin-velocity-chart" class="h-56 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-white/20 dark:border-white/10">
              ${[
                { day: 'Mon', res: 14, rep: 18 },
                { day: 'Tue', res: 19, rep: 21 },
                { day: 'Wed', res: 24, rep: 20 },
                { day: 'Thu', res: 22, rep: 25 },
                { day: 'Fri', res: 28, rep: 24 },
                { day: 'Sat', res: 12, rep: 10 },
                { day: 'Sun', res: 16, rep: 11 },
              ].map(d => `
                <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div class="w-full flex items-end justify-center gap-1 h-full">
                    <div class="w-3 sm:w-4 bg-slate-300/40 rounded-t-lg transition-all group-hover:bg-slate-300/60" style="height: ${d.rep * 3.4}px" title="${d.rep} Reported"></div>
                    <div class="w-3 sm:w-4 bg-indigo-600 rounded-t-lg transition-all group-hover:bg-indigo-500 shadow-sm" style="height: ${d.res * 3.4}px" title="${d.res} Resolved"></div>
                  </div>
                  <span class="text-[11px] font-bold text-slate-500">${d.day}</span>
                </div>
              `).join('')}
            </div>
          </div>
  
          <!-- Campus Space Capacity Distribution -->
          <div class="glass-card p-6 rounded-3xl shadow-card flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 mb-1">Space Atmosphere Load</h3>
              <p class="text-xs text-slate-400 mb-4">Real-time aggregate occupancy across zones</p>
  
              <div id="admin-space-load" class="space-y-4">
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-700">Silent Focus Floors</span>
                    <span class="text-indigo-600">78%</span>
                  </div>
                  <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-2 rounded-full" style="width: 78%"></div>
                  </div>
                </div>
  
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-700">Quiet Pods</span>
                    <span class="text-indigo-600">52%</span>
                  </div>
                  <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: 52%"></div>
                  </div>
                </div>
  
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-700">Moderate Labs (Block 34)</span>
                    <span class="text-indigo-600">42%</span>
                  </div>
                  <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                    <div class="bg-indigo-500 h-2 rounded-full" style="width: 42%"></div>
                  </div>
                </div>
  
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-700">Collaborative Lounges</span>
                    <span class="text-indigo-600">81%</span>
                  </div>
                  <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                    <div class="bg-pink-500 h-2 rounded-full" style="width: 81%"></div>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="pt-4 border-t border-white/20 dark:border-white/10 text-[11px] text-slate-400">
              Data refreshed live from SQLite sensor feeds
            </div>
          </div>
        </div>
  
        <!-- Staff Audit & Verification Queue Table -->
        <div class="glass-card rounded-3xl shadow-card overflow-hidden">
          <div class="p-6 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">AI Match Verification & Audit Queue</h3>
              <p class="text-xs text-slate-500">Staff review required before releasing high-value items for student in-person pickup</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              1 Pending Staff Action
            </span>
          </div>
  
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-white/20 dark:bg-slate-900/20 text-slate-400 uppercase text-[10px] font-bold border-b border-white/20 dark:border-white/10">
                <tr>
                  <th class="py-3.5 px-6">Match ID & Candidate</th>
                  <th class="py-3.5 px-6">Confidence Score</th>
                  <th class="py-3.5 px-6">Student Info</th>
                  <th class="py-3.5 px-6">Status</th>
                  <th class="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-audit-table-body" class="divide-y divide-white/20 dark:divide-white/10 text-slate-700">
                <!-- Rendered dynamically by app.js from ApiClient.get('/admin/audit-queue') -->
                <tr>
                  <td colspan="5" class="py-6 text-center text-slate-400">Loading audit queue...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- Source: js/app.js ---
  // =========================================================================
  // UniPulse SPA Orchestrator, Event Controller, and Global State Router
  // =========================================================================
  
  const UniPulse = {
    // Navigation Router
    navigateTo(viewName) {
      AppState.activeView = viewName;
      window.location.hash = viewName;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  
      // Fetch view specific fresh data
      if (viewName === 'dashboard') this.loadDashboard();
      if (viewName === 'spaces') this.loadSpaces();
      if (viewName === 'lostFound') this.loadLostItems();
      if (viewName === 'events') this.loadEvents();
      if (viewName === 'profile') this.loadProfile();
      if (viewName === 'admin') this.loadAdmin();
      if (viewName === 'campusMap') this.updateMapRoute();
    },
  
    // Switch between Student and Administrator
    async toggleRole() {
      const isCurrentlyStudent = AppState.user.role === 'student';
      const newRole = isCurrentlyStudent ? 'admin' : 'student';
  
      try {
        // Authenticate as the respective demo account
        const loginPayload = isCurrentlyStudent
          ? { email: 'admin@campus.edu', password: 'admin123' }
          : { email: 'alex@campus.edu', password: 'alex123' };
  
        const res = await ApiClient.post('/auth/login', loginPayload);
        AppState.user = res.user;
        AppState.token = res.token;
        localStorage.setItem('unipulse_token', res.token);
  
        showToast(`Switched to ${newRole === 'admin' ? 'Administrator' : 'Student'} Profile`, 'info');
  
        if (newRole === 'admin') {
          this.navigateTo('admin');
        } else {
          this.navigateTo('dashboard');
        }
      } catch (e) {
        showToast('Failed to switch role', 'error');
      }
    },
  
    // Modal Triggers
    openReportModal(kind) { openReportModal(kind); },
    openMatchAnalysisModal(matchId) { openMatchAnalysisModal(matchId); },
    openReserveModal(id, name) { openReserveModal(id, name); },
    openCommandPalette() { openCommandPalette(); },
    closeModal() { closeModal(); },
  
    toggleNotificationFlyout() {
      const el = document.getElementById('notification-flyout');
      if (el) el.classList.toggle('hidden');
    },
  
    clearNotifications() {
      AppState.unreadNotifications = 0;
      this.toggleNotificationFlyout();
      this.render();
      showToast('All notifications marked as read', 'info');
    },
  
    // -----------------------------------------------------------------------
    // Data Loaders
    // -----------------------------------------------------------------------
    async loadDashboard() {
      // 1. Load Live Study Spaces snapshot
      try {
        if (!AppState.spaces || AppState.spaces.length === 0) {
          AppState.spaces = await ApiClient.get('/study-spaces');
        }
        const spacesListEl = document.getElementById('dashboard-spaces-list');
        if (spacesListEl && AppState.spaces && AppState.spaces.length > 0) {
          const topSpaces = AppState.spaces.slice(0, 2);
          spacesListEl.innerHTML = topSpaces.map(s => {
            const rate = s.occupancy_rate || Math.round((s.current_occupancy / s.capacity) * 100);
            const badgeClass = rate > 75 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
            const openCount = Math.max(0, s.capacity - s.current_occupancy);
            return `
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between" id="dash-space-row-${s.id}">
                <div>
                  <div class="text-xs font-bold text-slate-900">${s.name}</div>
                  <div class="text-[11px] text-slate-500">${s.noise_rating} • ${openCount} Open Desks</div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeClass}">${rate}% Full</span>
                  <button onclick="UniPulse.openReserveModal('${s.id}', '${s.name}')" class="block mt-1 text-[11px] font-bold text-indigo-600 hover:underline">Reserve Desk</button>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (e) {
        console.warn('[Dashboard] Could not load spaces snapshot', e);
      }
  
      // 2. Load Events snapshot
      try {
        if (!AppState.events || AppState.events.length === 0) {
          AppState.events = await ApiClient.get('/events');
        }
        const eventsListEl = document.getElementById('dashboard-events-list');
        if (eventsListEl && AppState.events && AppState.events.length > 0) {
          const topEvents = AppState.events.slice(0, 2);
          eventsListEl.innerHTML = topEvents.map(ev => {
            const isRsvped = AppState.rsvps.has(ev.id);
            return `
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-900">${ev.title}</div>
                  <div class="text-[11px] text-slate-500">${ev.date_str} • ${ev.location}</div>
                </div>
                <button onclick="UniPulse.handleRSVPToggle('${ev.id}', this)" class="px-3 py-1.5 rounded-xl ${isRsvped ? 'bg-emerald-600 text-white' : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'} text-xs font-bold shadow-xs">
                  ${isRsvped ? "✓ RSVP'd" : "RSVP"}
                </button>
              </div>
            `;
          }).join('');
        }
      } catch (e) {
        console.warn('[Dashboard] Could not load events snapshot', e);
      }
  
      // 3. Load Proactive AI Match card
      try {
        const match = await ApiClient.get('/items/match-91');
        const matchCardEl = document.getElementById('dashboard-proactive-match');
        if (matchCardEl && match) {
          const score = Math.round(match.confidence_score || 91);
          const isClaimed = match.status === 'claimed';
          matchCardEl.innerHTML = `
            <div class="flex items-start gap-4">
              <div class="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-indigo-50 rounded-2xl border border-indigo-100">
                <svg class="w-14 h-14" viewBox="0 0 36 36">
                  <path class="text-slate-200" stroke-width="3" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-indigo-600 score-circle" stroke-dasharray="${score}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="absolute text-xs font-black text-indigo-700">${score}%</span>
              </div>
  
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${isClaimed ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                    ${isClaimed ? 'Claim Dispatched' : 'Candidate Matched'}
                  </span>
                  <span class="text-xs text-slate-400 font-medium">Auto-detected candidate</span>
                </div>
                <h3 class="text-lg font-bold text-slate-900">${match.lost_item?.title || 'Hydro Flask Navy Blue 32oz'}</h3>
                <p class="text-xs text-slate-600 mt-0.5">
                  Turned in at <strong>${match.desk_location}</strong> matches your reported lost bottle with ${match.confidence_score}% multi-factor confidence.
                </p>
              </div>
            </div>
  
            <div class="flex items-center gap-3 w-full md:w-auto">
              <button onclick="UniPulse.openMatchAnalysisModal('${match.id}')"
                      class="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                <span>View ${score}% AI Match</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          `;
        }
      } catch (e) {
        console.warn('[Dashboard] Could not load proactive match', e);
      }
    },
  
    async loadSpaces() {
      try {
        const spaces = await ApiClient.get('/study-spaces');
        AppState.spaces = spaces;
        this.renderSpacesFeed(spaces);
      } catch (e) {
        console.error(e);
      }
    },
  
    renderSpacesFeed(spaces) {
      const grid = document.getElementById('study-spaces-grid');
      if (!grid) return;
  
      if (!spaces || spaces.length === 0) {
        grid.innerHTML = `<div class="p-8 text-center col-span-2 text-slate-400 text-xs">No study spaces found.</div>`;
        return;
      }
  
      grid.innerHTML = spaces.map(s => {
        const rate = s.occupancy_rate || Math.round((s.current_occupancy / s.capacity) * 100);
        const isHigh = rate > 75;
        const isMed = rate > 45 && rate <= 75;
        const badgeColor = s.noise_rating === 'Silent Focus' ? 'badge-silent' :
                           s.noise_rating === 'Quiet' ? 'badge-quiet' :
                           s.noise_rating === 'Moderate' ? 'badge-moderate' : 'badge-collaborative';
  
        const barColor = isHigh ? 'bg-amber-500' : isMed ? 'bg-indigo-600' : 'bg-emerald-500';
  
        return `
          <div class="glass-card glass-card-hover rounded-3xl p-6 border border-white/80 shadow-card flex flex-col justify-between" id="space-card-${s.id}">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${s.location_name || 'Campus'}</span>
                  <h3 class="text-base font-bold text-slate-900 mt-0.5">${s.name}</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeColor}">
                  ${s.noise_rating}
                </span>
              </div>
  
              <!-- Occupancy Progress Meter -->
              <div class="my-4">
                <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span class="text-slate-600">Seat Occupancy: <strong class="space-occupancy-count text-slate-900">${s.current_occupancy} / ${s.capacity}</strong></span>
                  <span class="space-occupancy-rate font-bold ${isHigh ? 'text-amber-600' : 'text-indigo-600'}">${rate}%</span>
                </div>
                <div class="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden border border-white/60">
                  <div class="${barColor} h-2.5 rounded-full transition-all duration-500 shadow-xs" style="width: ${rate}%"></div>
                </div>
              </div>
  
              <!-- Amenities -->
              <div class="flex flex-wrap gap-1.5 mb-4 text-[11px]">
                <span class="px-2 py-0.5 rounded-lg bg-white/60 border border-white/80 text-slate-600 font-medium">⚡ Power at Every Desk</span>
                <span class="px-2 py-0.5 rounded-lg bg-white/60 border border-white/80 text-slate-600 font-medium">📶 Fast Wi-Fi 6</span>
                <span class="px-2 py-0.5 rounded-lg bg-white/60 border border-white/80 text-slate-600 font-medium">☀️ Natural Light</span>
              </div>
            </div>
  
            <!-- Bottom CTA -->
            <div class="pt-4 border-t border-white/60 flex items-center justify-between">
              <div class="text-xs text-slate-500">
                <strong class="space-available-desks text-emerald-600 font-bold">${Math.max(0, s.capacity - s.current_occupancy)} Desks</strong> Available Now
              </div>
              <button onclick="UniPulse.openReserveModal('${s.id}', '${s.name}')"
                      class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all">
                Reserve Desk
              </button>
            </div>
          </div>
        `;
      }).join('');
    },
  
    filterSpaces(noise, tab) {
      document.querySelectorAll('.space-filter-tab').forEach(t => {
        t.className = 'space-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200';
      });
      tab.className = 'space-filter-tab active px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200';
  
      if (noise === 'all') {
        this.renderSpacesFeed(AppState.spaces);
      } else {
        const filtered = AppState.spaces.filter(s => s.noise_rating === noise);
        this.renderSpacesFeed(filtered);
      }
    },
  
    // -----------------------------------------------------------------------
    // Lost & Found Handlers
    // -----------------------------------------------------------------------
    async loadLostItems() {
      try {
        const items = await ApiClient.get('/items');
        AppState.items = items;
        this.renderLostFeed(items);
      } catch (e) {
        console.error(e);
      }
    },
  
    renderLostFeed(items) {
      const grid = document.getElementById('lost-items-grid');
      if (!grid) return;
  
      if (!items || items.length === 0) {
        grid.innerHTML = `<div class="p-8 text-center col-span-3 text-slate-400 text-xs">No items reported yet.</div>`;
        return;
      }
  
      grid.innerHTML = items.map(item => {
        const isLost = item.kind === 'lost';
        const isMatched = item.status === 'matched';
  
        return `
          <div class="glass-card glass-card-hover rounded-3xl p-5 border border-white/80 shadow-card flex flex-col justify-between">
            <div>
              <div class="relative mb-3 overflow-hidden rounded-2xl">
                <img src="${item.image_url}" alt="${item.title}" class="w-full h-44 object-cover rounded-2xl transition-transform duration-300 hover:scale-105">
                <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  isLost ? 'bg-amber-100/90 text-amber-800 border border-amber-200 backdrop-blur-sm' : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200 backdrop-blur-sm'
                }">
                  ${item.kind}
                </span>
                ${isMatched ? `
                  <span class="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-indigo-600/90 text-white shadow-md backdrop-blur-sm border border-indigo-400/30">
                    ${item.match_score ? `${Math.round(item.match_score)}% Match` : '91% Match'}
                  </span>
                ` : ''}
              </div>
  
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${item.category}</span>
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">${item.title}</h3>
              <p class="text-xs text-slate-500 mt-1 line-clamp-2">${item.description}</p>
            </div>
  
            <div class="mt-4 pt-3 border-t border-white/60 flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-medium">${item.location_name || 'Main Library'}</span>
              ${isMatched ? `
                <button onclick="UniPulse.openMatchAnalysisModal('${item.match_id || 'match-91'}')"
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                  <span>View Match</span>
                  <span>→</span>
                </button>
              ` : `
                <span class="text-xs text-slate-400 font-medium">Status: ${item.status}</span>
              `}
            </div>
          </div>
        `;
      }).join('');
    },
  
    filterLostItems(filter, tab) {
      document.querySelectorAll('.item-filter-tab').forEach(t => {
        t.className = 'item-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200';
      });
      tab.className = 'item-filter-tab active px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200';
  
      if (filter === 'all') {
        this.renderLostFeed(AppState.items);
      } else if (filter === 'matched') {
        this.renderLostFeed((AppState.items || []).filter(i => i.status === 'matched'));
      } else {
        this.renderLostFeed((AppState.items || []).filter(i => i.kind === filter));
      }
    },
  
    handlePhotoUploadPreview(input) {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          AppState._pendingPhotoBase64 = e.target.result;
          const preview = document.getElementById('photo-preview-container');
          if (preview) {
            preview.innerHTML = `
              <img src="${e.target.result}" class="w-24 h-24 object-cover rounded-xl mb-1 shadow-sm">
              <span class="text-xs text-emerald-600 font-bold">✓ Photo Attached</span>
            `;
          }
        };
        reader.readAsDataURL(input.files[0]);
      }
    },
  
    async handleReportSubmit(e, kind) {
      e.preventDefault();
      const title = document.getElementById('report-title').value;
      const category = document.getElementById('report-category').value;
      const location_id = document.getElementById('report-location').value;
      const description = document.getElementById('report-description').value;
  
      let imageUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80";
  
      if (AppState._pendingPhotoBase64) {
        try {
          const uploadRes = await ApiClient.post('/upload', { image_base64: AppState._pendingPhotoBase64 });
          if (uploadRes && uploadRes.url) {
            imageUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn('[Upload] Photo upload failed, using fallback', uploadErr);
        }
        AppState._pendingPhotoBase64 = null;
      }
  
      closeModal();
  
      try {
        const res = await ApiClient.post('/items', {
          title, category, location_id, description, kind, image_url: imageUrl
        });
  
        showToast(`Report for "${title}" registered in campus database!`, 'success');
  
        if (res.matches_found > 0 && res.matches && res.matches.length > 0) {
          const targetMatchId = res.matches[0].match_id || 'match-91';
          setTimeout(() => {
            showToast(`AI Match Engine detected a candidate match for "${title}"!`, 'info', 'High Confidence Match');
            openMatchAnalysisModal(targetMatchId);
          }, 800);
        }
  
        this.loadLostItems();
      } catch (err) {
        showToast('Failed to submit report', 'error');
      }
    },
  
    async handleClaimDispatch(matchId) {
      try {
        const res = await ApiClient.post(`/matches/${matchId}/claim`);
        closeModal();
        showToast(`Claim dispatched! Digital verification code: ${res.claim_code}`, 'success', 'Claim Registered');
        this.loadLostItems();
      } catch (e) {
        showToast('Claim dispatch failed', 'error');
      }
    },
  
    // -----------------------------------------------------------------------
    // Study Spaces Reservation Handlers
    // -----------------------------------------------------------------------
    selectDuration(btn, mins) {
      document.querySelectorAll('.duration-pill').forEach(b => {
        b.className = 'duration-pill py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300';
      });
      btn.className = 'duration-pill active py-2 rounded-xl border border-indigo-600 bg-indigo-50 text-indigo-700 text-xs font-bold';
      document.getElementById('reserve-duration').value = mins;
    },
  
    async handleReserveSubmit(e, spaceId) {
      e.preventDefault();
      const desk = document.getElementById('reserve-desk-select').value;
      const duration = document.getElementById('reserve-duration').value;
  
      closeModal();
  
      try {
        const res = await ApiClient.post(`/study-spaces/${spaceId}/reserve`, {
          desk_number: desk,
          duration_minutes: duration
        });
  
        showToast(`Desk ${desk} reserved! Digital pass: ${res.pass_code}`, 'success', 'Pass Issued');
        this.loadSpaces();
      } catch (err) {
        showToast('Reservation failed', 'error');
      }
    },
  
    // -----------------------------------------------------------------------
    // Campus Events Handlers
    // -----------------------------------------------------------------------
    async loadEvents() {
      try {
        const events = await ApiClient.get('/events');
        AppState.events = events;
        this.renderEventsFeed(events);
      } catch (e) {
        console.error(e);
      }
    },
  
    renderEventsFeed(events) {
      const grid = document.getElementById('events-feed-grid');
      if (!grid) return;
  
      if (!events || events.length === 0) {
        grid.innerHTML = `<div class="p-8 text-center col-span-2 text-slate-400 text-xs">No events found.</div>`;
        return;
      }
  
      grid.innerHTML = events.map(ev => {
        const isRsvped = AppState.rsvps.has(ev.id);
  
        return `
          <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                  ${ev.category}
                </span>
                <span class="text-xs text-slate-500 font-medium">${ev.date_str}</span>
              </div>
  
              <h3 class="text-base font-bold text-slate-900 mt-1">${ev.title}</h3>
              <p class="text-xs text-slate-500 mt-1">Organized by <strong class="text-slate-700">${ev.organizer}</strong></p>
  
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                <span>${ev.location} • ${ev.time_str}</span>
              </div>
  
              <div class="mt-3 flex flex-wrap gap-1">
                ${(ev.tags || []).map(t => `<span class="px-2 py-0.5 rounded-md bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-medium">#${t}</span>`).join('')}
              </div>
            </div>
  
            <div class="mt-5 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
              <span class="text-xs text-slate-500 font-medium">
                <strong class="text-slate-800">${ev.attendees_count}</strong> students attending
              </span>
              <button onclick="UniPulse.handleRSVPToggle('${ev.id}', this)"
                      class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isRsvped
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                      }">
                ${isRsvped ? '✓ RSVP Registered' : 'RSVP for Event'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    },
  
    async handleRSVPToggle(eventId, btn) {
      try {
        const res = await ApiClient.post(`/events/${eventId}/rsvp`);
        if (res.is_rsvped) {
          AppState.rsvps.add(eventId);
          btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white shadow-xs';
          btn.innerText = '✓ RSVP Registered';
          showToast('RSVP confirmed for event!', 'success');
        } else {
          AppState.rsvps.delete(eventId);
          btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-600 text-indigo-600 hover:bg-indigo-50';
          btn.innerText = 'RSVP for Event';
          showToast('RSVP cancelled', 'info');
        }
      } catch (e) {
        showToast('Failed to update RSVP', 'error');
      }
    },
  
    filterEvents(cat, tab) {
      document.querySelectorAll('.event-filter-tab').forEach(t => {
        t.className = 'event-filter-tab glass-pill px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300';
      });
      tab.className = 'event-filter-tab glass-pill active px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400';
  
      if (cat === 'all') {
        this.renderEventsFeed(AppState.events);
      } else {
        const filtered = (AppState.events || []).filter(e => e.category === cat || (e.tags || []).includes(cat));
        this.renderEventsFeed(filtered);
      }
    },
  
    // -----------------------------------------------------------------------
    // Campus Finder Map Handlers
    // -----------------------------------------------------------------------
    async updateMapRoute() {
      const fromEl = document.getElementById('route-from-select');
      const toEl = document.getElementById('route-to-select');
      if (!fromEl || !toEl) return;
  
      const f = fromEl.value;
      const t = toEl.value;
  
      try {
        const res = await ApiClient.get(`/route?from=${f}&to=${t}`);
        const line = document.getElementById('svg-animated-route-line');
        const pill = document.getElementById('route-metric-pill');
  
        if (line && res.polyline) {
          line.setAttribute('d', res.polyline);
        }
        if (pill) {
          pill.innerText = `${res.distance_meters}m • ~${res.walk_time_minutes} min walk`;
        }
  
        // Update Directory Details Card with destination info and turn-by-turn steps
        const detailsEl = document.getElementById('map-directory-details');
        if (detailsEl) {
          const destInfoMap = {
            sport: { name: 'Sports & Recreation Complex', icon: '🏀', desc: 'Olympic swimming pool, indoor courts, climbing gym, and outdoor athletic track.', hours: '6:00 AM - 10:00 PM' },
            b34: { name: 'Block 34 (Engineering & CS)', icon: '💻', desc: 'Home to School of Computer Science & Robotics Labs with modern glass atrium and labs.', hours: '7:00 AM - 10:00 PM' },
            lib: { name: 'Main University Library', icon: '📚', desc: '5-story research facility with quiet study zones, 24/7 reading rooms, and media center.', hours: '8:00 AM - 11:00 PM' },
            sc: { name: 'Student Commons & Dining', icon: '☕', desc: 'Central student hub with dining hall, bookstore, and collaborative lounge.', hours: '7:30 AM - 9:30 PM' },
            inn: { name: 'Innovation & Incubation Hub', icon: '💡', desc: 'Startup incubator, maker space, 3D printing lab, and collaborative project rooms.', hours: '8:00 AM - 9:00 PM' }
          };
          const destInfo = destInfoMap[t] || { name: 'Campus Facility', icon: '🏛️', desc: 'University campus facility.', hours: '8:00 AM - 9:00 PM' };
  
          detailsEl.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Active Destination</span>
                <h3 class="text-lg font-bold text-slate-900 mt-1">${destInfo.name}</h3>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                ${destInfo.icon}
              </div>
            </div>
  
            <p class="text-xs text-slate-600 leading-relaxed">${destInfo.desc}</p>
  
            <div class="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Hours:</span>
                <span class="font-bold text-slate-800">${destInfo.hours}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Transit from ${f.toUpperCase()}:</span>
                <span class="font-bold text-indigo-600">~${res.walk_time_minutes} mins (${res.distance_meters} meters)</span>
              </div>
            </div>
  
            <!-- Turn-by-Turn Steps -->
            <div class="space-y-2">
              <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Turn-by-Turn Path</h5>
              <div class="space-y-2 text-xs text-slate-600">
                ${(res.steps || []).map((step, idx) => `
                  <div class="flex items-start gap-2">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">${idx + 1}</span>
                    <span>${step}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
  
        showToast(`Walking route updated: ~${res.walk_time_minutes} mins (${res.distance_meters}m)`, 'info');
      } catch (e) {
        console.error(e);
      }
    },
  
    selectMapBuilding(buildingId) {
      const toSelect = document.getElementById('route-to-select');
      if (toSelect) {
        toSelect.value = buildingId;
        this.updateMapRoute();
      }
    },
  
    // -----------------------------------------------------------------------
    // AI Campus Assistant Handlers
    // -----------------------------------------------------------------------
    triggerAssistantPrompt(query) {
      this.navigateTo('assistant');
      setTimeout(() => {
        this.sendAssistantMessage(query);
      }, 150);
    },
  
    handleAssistantSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('assistant-input');
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      this.sendAssistantMessage(msg);
    },
  
    async sendAssistantMessage(text) {
      const container = document.getElementById('assistant-chat-stream');
      if (!container) return;
  
      // Append User Message Bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'flex items-start justify-end gap-3 max-w-2xl ml-auto animate-fadeIn';
      userBubble.innerHTML = `
        <div class="p-4 rounded-2xl rounded-tr-none bg-indigo-600 text-white text-xs sm:text-sm leading-relaxed shadow-sm">
          ${text}
        </div>
        <img src="${AppState.user.avatar_url}" class="w-8 h-8 rounded-xl object-cover border border-indigo-200">
      `;
      container.appendChild(userBubble);
      container.scrollTop = container.scrollHeight;
  
      // Append Assistant Message Bubble (initially loading)
      const aiBubble = document.createElement('div');
      aiBubble.className = 'flex items-start gap-3 max-w-2xl animate-fadeIn';
      aiBubble.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
          AI
        </div>
        <div class="space-y-3 flex-1">
          <div class="chat-content p-4 rounded-2xl rounded-tl-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed flex items-center gap-2 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
            <span class="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
            <span class="text-xs text-slate-400 font-medium ml-1">Analyzing campus sensors...</span>
          </div>
          <div class="chat-cards grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 hidden"></div>
        </div>
      `;
      container.appendChild(aiBubble);
      container.scrollTop = container.scrollHeight;
  
      let streamedText = '';
      const contentEl = aiBubble.querySelector('.chat-content');
      const cardsEl = aiBubble.querySelector('.chat-cards');
  
      try {
        await ApiClient.streamAssistant(
          text,
          AppState.assistantSessionId,
          (token) => {
            if (!streamedText) {
              contentEl.className = 'chat-content p-4 rounded-2xl rounded-tl-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed shadow-xs';
              contentEl.innerHTML = '';
            }
            streamedText += token;
            contentEl.innerText = streamedText;
            container.scrollTop = container.scrollHeight;
          },
          (completeRes) => {
            contentEl.className = 'chat-content p-4 rounded-2xl rounded-tl-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed shadow-xs';
            contentEl.innerText = completeRes.content;
            if (completeRes.cards && completeRes.cards.length > 0) {
              cardsEl.classList.remove('hidden');
              cardsEl.innerHTML = completeRes.cards.map(c => this.renderAssistantCard(c)).join('');
            }
            this.syncRightContextPanel(completeRes);
            container.scrollTop = container.scrollHeight;
          },
          (err) => {
            contentEl.className = 'chat-content p-4 rounded-2xl rounded-tl-none bg-rose-50 border border-rose-100 text-rose-700 text-xs';
            contentEl.innerText = 'Sorry, I encountered an error checking live sensors. Please try again.';
          }
        );
      } catch (e) {
        contentEl.className = 'chat-content p-4 rounded-2xl rounded-tl-none bg-rose-50 border border-rose-100 text-rose-700 text-xs';
        contentEl.innerText = 'Sorry, I encountered an error checking live sensors. Please try again.';
      }
    },
  
    renderAssistantCard(card) {
      if (card.type === 'study_space') {
        const d = card.data;
        return `
          <div class="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-900">${d.name}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">${d.noise_rating}</span>
            </div>
            <div class="text-[11px] text-slate-500 mb-2">${d.open_desks} Open Desks • ${d.walk_time}</div>
            <button onclick="UniPulse.openReserveModal('${d.id}', '${d.name}')"
                    class="w-full py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
              Reserve Desk
            </button>
          </div>
        `;
      }
      if (card.type === 'location') {
        const d = card.data;
        return `
          <div class="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-900">${d.name}</span>
              <span class="text-[10px] font-bold text-indigo-600">${d.code}</span>
            </div>
            <div class="text-[11px] text-slate-500 mb-2">${d.open_hours}</div>
            <button onclick="UniPulse.navigateTo('campusMap')"
                    class="w-full py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
              View Walking Map
            </button>
          </div>
        `;
      }
      if (card.type === 'match') {
        const d = card.data;
        return `
          <div class="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 backdrop-blur-md border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-900">${d.title}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">${d.confidence}% Match</span>
            </div>
            <div class="text-[11px] text-slate-600 mb-2">${d.location} • ${d.status}</div>
            <button onclick="UniPulse.openMatchAnalysisModal('match-91')"
                    class="w-full py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
              View Side-by-Side Analysis
            </button>
          </div>
        `;
      }
      if (card.type === 'event') {
        const d = card.data;
        return `
          <div class="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-900">${d.title}</span>
              <span class="text-[10px] font-bold text-purple-600">${d.organizer || 'Campus'}</span>
            </div>
            <div class="text-[11px] text-slate-500 mb-2">${d.location || ''} • ${d.date || ''}</div>
            <button onclick="UniPulse.navigateTo('events')"
                    class="w-full py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
              View & RSVP
            </button>
          </div>
        `;
      }
      return '';
    },
  
    syncRightContextPanel(assistantResponse) {
      const panel = document.getElementById('context-panel-content');
      if (!panel) return;
  
      if (assistantResponse.cards && assistantResponse.cards.length > 0) {
        const firstCard = assistantResponse.cards[0];
        if (firstCard.type === 'study_space') {
          const d = firstCard.data;
          panel.innerHTML = `
            <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 backdrop-blur-sm">
              <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Active Context • Study Desk</span>
              <h5 class="text-sm font-bold text-slate-900 mt-1">${d.name}</h5>
              <div class="my-2">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-500">Live Occupancy</span>
                  <span class="font-bold text-indigo-600">${d.occupancy}%</span>
                </div>
                <div class="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: ${d.occupancy}%"></div>
                </div>
              </div>
              <div class="text-xs text-slate-600 mb-3">${d.open_desks} available desks • ${d.walk_time}</div>
              <button onclick="UniPulse.openReserveModal('${d.id}', '${d.name}')"
                      class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors">
                Reserve Study Desk Now
              </button>
            </div>
          `;
        } else if (firstCard.type === 'location') {
          const d = firstCard.data;
          panel.innerHTML = `
            <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 backdrop-blur-sm">
              <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Active Context • Campus Location</span>
              <h5 class="text-sm font-bold text-slate-900 mt-1">${d.name} (${d.code || ''})</h5>
              <div class="my-2 text-xs text-slate-600">${d.open_hours || 'Open Daily'}</div>
              <div class="text-xs text-slate-500 mb-3">${d.walk_time ? `Est. Walking: ${d.walk_time}` : ''}</div>
              <button onclick="UniPulse.navigateTo('campusMap')"
                      class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors">
                Open in Campus Finder
              </button>
            </div>
          `;
        } else if (firstCard.type === 'match') {
          const d = firstCard.data;
          panel.innerHTML = `
            <div class="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 backdrop-blur-sm">
              <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Active Context • AI Match</span>
              <h5 class="text-sm font-bold text-slate-900 mt-1">${d.title}</h5>
              <div class="my-2 flex items-center justify-between text-xs">
                <span class="text-slate-500">Confidence</span>
                <span class="font-bold text-indigo-600">${d.confidence}% Match</span>
              </div>
              <div class="text-xs text-slate-600 mb-3">Turned in at ${d.location || 'Information Desk'}</div>
              <button onclick="UniPulse.openMatchAnalysisModal('${d.match_id || 'match-91'}')"
                      class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors">
                Inspect 91% Match Details
              </button>
            </div>
          `;
        } else if (firstCard.type === 'event') {
          const d = firstCard.data;
          panel.innerHTML = `
            <div class="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/50 backdrop-blur-sm">
              <span class="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Active Context • Recommended Event</span>
              <h5 class="text-sm font-bold text-slate-900 mt-1">${d.title}</h5>
              <div class="my-2 text-xs text-slate-600">${d.date || ''} • ${d.location || ''}</div>
              <div class="text-xs text-slate-500 mb-3">${d.attendees ? `${d.attendees} students attending` : ''}</div>
              <button onclick="UniPulse.navigateTo('events')"
                      class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors">
                Open Event & RSVP
              </button>
            </div>
          `;
        }
      }
    },
  
    clearAssistantChat() {
      AppState.assistantSessionId = 'sess-' + Math.random().toString(36).substring(2, 9);
      this.render();
    },
  
    // -----------------------------------------------------------------------
    // Global Search & Hero Handlers
    // -----------------------------------------------------------------------
    handleHeroSearch(query) {
      if (!query) return;
      this.triggerAssistantPrompt(query);
    },
  
    async handleCommandSearch(query) {
      const resultsContainer = document.getElementById('cmd-k-results');
      if (!resultsContainer) return;
  
      if (!query.trim()) {
        // Show default quick actions
        resultsContainer.innerHTML = `
          <div class="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</div>
          <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors text-left group" onclick="UniPulse.navigateTo('spaces'); UniPulse.closeModal()">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">⚡</div>
              <div>
                <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-900">Reserve Quiet Study Desk</div>
                <div class="text-[11px] text-slate-400">Main Library Level 3 or Block 34</div>
              </div>
            </div>
            <span class="text-[10px] text-slate-400">Spaces</span>
          </button>
        `;
        return;
      }
  
      try {
        const res = await ApiClient.get(`/search?q=${encodeURIComponent(query)}`);
        let html = '';
  
        if (res.actions && res.actions.length > 0) {
          html += `<div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Actions</div>`;
          res.actions.forEach(a => {
            html += `
              <button class="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 transition-colors text-left" onclick="UniPulse.navigateTo('${a.view}'); UniPulse.closeModal()">
                <span class="text-xs font-semibold text-slate-800">${a.title}</span>
                <span class="text-[10px] text-indigo-600">Action</span>
              </button>
            `;
          });
        }
  
        if (res.locations && res.locations.length > 0) {
          html += `<div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase mt-2">Campus Buildings</div>`;
          res.locations.forEach(l => {
            html += `
              <button class="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 transition-colors text-left" onclick="UniPulse.navigateTo('campusMap'); UniPulse.closeModal()">
                <span class="text-xs font-semibold text-slate-800">${l.name} (${l.code})</span>
                <span class="text-[10px] text-slate-400">Finder</span>
              </button>
            `;
          });
        }
  
        if (res.study_spaces && res.study_spaces.length > 0) {
          html += `<div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase mt-2">Study Spaces</div>`;
          res.study_spaces.forEach(s => {
            html += `
              <button class="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 transition-colors text-left" onclick="UniPulse.openReserveModal('${s.id}', '${s.name}')">
                <span class="text-xs font-semibold text-slate-800">${s.name} (${s.noise_rating})</span>
                <span class="text-[10px] text-emerald-600 font-bold">${s.occupancy_rate}% Full</span>
              </button>
            `;
          });
        }
  
        resultsContainer.innerHTML = html || `<div class="p-4 text-center text-xs text-slate-400">No matching campus resources found.</div>`;
      } catch (e) {
        console.error(e);
      }
    },
  
    // -----------------------------------------------------------------------
    // Admin Console Queue Handlers
    // -----------------------------------------------------------------------
    async loadAdminQueue() {
      try {
        const queue = await ApiClient.get('/admin/audit-queue');
        const tbody = document.getElementById('admin-audit-table-body');
        if (!tbody) return;
  
        if (!queue || queue.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Audit queue is empty. All matches verified.</td></tr>`;
          return;
        }
  
        tbody.innerHTML = queue.map(m => `
          <tr class="hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
            <td class="py-4 px-6">
              <div class="font-bold text-slate-900">${m.lost_title}</div>
              <div class="text-[11px] text-slate-400">Found: ${m.found_title}</div>
            </td>
            <td class="py-4 px-6">
              <span class="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
                ${m.confidence_score}%
              </span>
            </td>
            <td class="py-4 px-6">
              <div class="font-medium text-slate-800">${m.student_name || 'Alex Rivera'}</div>
              <div class="text-[11px] text-slate-400">${m.student_email || 'alex@campus.edu'}</div>
            </td>
            <td class="py-4 px-6">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                m.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                m.status === 'claimed' ? 'bg-indigo-100 text-indigo-800' :
                'bg-amber-100 text-amber-800'
              }">
                ${m.status}
              </span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <button onclick="UniPulse.handleAdminVerify('${m.id}', 'approve')"
                      class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs">
                Approve
              </button>
              <button onclick="UniPulse.handleAdminVerify('${m.id}', 'reject')"
                      class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all">
                Reject
              </button>
            </td>
          </tr>
        `).join('');
      } catch (e) {
        console.error(e);
      }
    },
  
    async loadAdmin() {
      this.loadAdminQueue();
      this.loadAdminKPIs();
    },
  
    async loadAdminKPIs() {
      try {
        const kpis = await ApiClient.get('/admin/kpis');
        const studentsEl = document.getElementById('admin-kpi-students');
        if (studentsEl) studentsEl.innerText = kpis.active_students.toLocaleString();
        const accuracyEl = document.getElementById('admin-kpi-accuracy');
        if (accuracyEl) accuracyEl.innerText = `${kpis.ai_match_rate}%`;
        const reportsEl = document.getElementById('admin-kpi-reports');
        if (reportsEl) reportsEl.innerText = kpis.active_lost_reports;
        const resolvedEl = document.getElementById('admin-kpi-resolved');
        if (resolvedEl) resolvedEl.innerText = kpis.resolved_this_week;
  
        // Update resolution velocity chart
        const chartEl = document.getElementById('admin-velocity-chart');
        if (chartEl && kpis.resolution_velocity) {
          chartEl.innerHTML = kpis.resolution_velocity.map(d => `
            <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div class="w-full flex items-end justify-center gap-1 h-full">
                <div class="w-3 sm:w-4 bg-slate-300/40 rounded-t-lg transition-all group-hover:bg-slate-300/60" style="height: ${d.reported * 3.4}px" title="${d.reported} Reported"></div>
                <div class="w-3 sm:w-4 bg-indigo-600 rounded-t-lg transition-all group-hover:bg-indigo-500 shadow-sm" style="height: ${d.resolved * 3.4}px" title="${d.resolved} Resolved"></div>
              </div>
              <span class="text-[11px] font-bold text-slate-500">${d.day}</span>
            </div>
          `).join('');
        }
  
        // Update space atmosphere load
        const spaceLoadEl = document.getElementById('admin-space-load');
        if (spaceLoadEl && kpis.capacity_distribution) {
          const cd = kpis.capacity_distribution;
          spaceLoadEl.innerHTML = `
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">Silent Focus Floors</span>
                <span class="text-indigo-600">${cd.silent}%</span>
              </div>
              <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-2 rounded-full" style="width: ${cd.silent}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">Quiet Pods</span>
                <span class="text-indigo-600">${cd.quiet}%</span>
              </div>
              <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${cd.quiet}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">Moderate Labs (Block 34)</span>
                <span class="text-indigo-600">${cd.moderate}%</span>
              </div>
              <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-2 rounded-full" style="width: ${cd.moderate}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs font-semibold mb-1">
                <span class="text-slate-700">Collaborative Lounges</span>
                <span class="text-indigo-600">${cd.collaborative}%</span>
              </div>
              <div class="w-full bg-white/40 dark:bg-slate-800/40 h-2 rounded-full overflow-hidden">
                <div class="bg-pink-500 h-2 rounded-full" style="width: ${cd.collaborative}%"></div>
              </div>
            </div>
          `;
        }
      } catch (e) {
        console.warn('[Admin] Failed to load KPIs', e);
      }
    },
  
    async loadProfile() {
      try {
        const data = await ApiClient.get('/profile');
        if (data.user) {
          AppState.user = data.user;
        }
  
        // Render Active Desk Passes
        const passesEl = document.getElementById('profile-active-passes');
        if (passesEl) {
          if (data.reservations && data.reservations.length > 0) {
            passesEl.innerHTML = data.reservations.map(r => `
              <div class="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">${r.space_name} — Desk ${r.desk_number}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">${r.status}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1 font-mono">Pass: ${r.pass_code} • Valid for 45 mins</div>
              </div>
            `).join('');
          } else {
            passesEl.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No active study desk passes.</div>`;
          }
        }
  
        // Render Submitted Reports
        const reportsEl = document.getElementById('profile-submitted-reports');
        if (reportsEl) {
          if (data.reports && data.reports.length > 0) {
            reportsEl.innerHTML = data.reports.map(rp => `
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">${rp.title}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${rp.status === 'matched' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'} uppercase">${rp.status}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">${rp.description ? rp.description.substring(0, 60) + '...' : ''}</div>
              </div>
            `).join('');
          } else {
            reportsEl.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No campus reports submitted yet.</div>`;
          }
        }
      } catch (e) {
        console.warn('[Profile] Failed to load profile details', e);
      }
    },
  
    // -----------------------------------------------------------------------
    // Student Profile Interests Handlers
    // -----------------------------------------------------------------------
    async handleAddInterest(e) {
      e.preventDefault();
      const input = document.getElementById('new-interest-input');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
  
      const current = AppState.user.interests || [];
      if (!current.includes(val)) {
        current.push(val);
        try {
          await ApiClient.put('/profile/interests', { interests: current });
          AppState.user.interests = current;
          showToast(`Interest tag "${val}" added`, 'success');
          this.render();
        } catch (err) {
          showToast('Failed to save interest', 'error');
        }
      }
    },
  
    async removeInterest(tag) {
      let current = AppState.user.interests || [];
      current = current.filter(t => t !== tag);
      try {
        await ApiClient.put('/profile/interests', { interests: current });
        AppState.user.interests = current;
        showToast(`Tag removed`, 'info');
        this.render();
      } catch (err) {
        showToast('Failed to remove interest', 'error');
      }
    },
  
    // -----------------------------------------------------------------------
    // Render Orchestrator
    // -----------------------------------------------------------------------
    render() {
      const root = document.getElementById('app-root');
      if (!root) return;
  
      let viewHtml = '';
      switch (AppState.activeView) {
        case 'dashboard': viewHtml = renderDashboard(); break;
        case 'assistant': viewHtml = renderAssistant(); break;
        case 'campusMap': viewHtml = renderCampusMap(); break;
        case 'lostFound': viewHtml = renderLostFound(); break;
        case 'spaces': viewHtml = renderSpaces(); break;
        case 'events': viewHtml = renderEvents(); break;
        case 'profile': viewHtml = renderProfile(); break;
        case 'admin': viewHtml = renderAdmin(); break;
        default: viewHtml = renderDashboard();
      }
  
      root.innerHTML = `
        <div class="flex h-screen overflow-hidden bg-transparent">
          ${renderSidebar()}
          <div class="flex-1 flex flex-col h-screen overflow-y-auto">
            ${renderHeader()}
            <main class="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
              ${viewHtml}
            </main>
          </div>
        </div>
        <div id="modal-root"></div>
        <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"></div>
      `;
  
      // Start rotating suggestion ticker on Dashboard
      if (AppState.activeView === 'dashboard') {
        this.startHeroTicker();
      }
    },
  
    startHeroTicker() {
      if (this._tickerInterval) clearInterval(this._tickerInterval);
      let idx = 0;
      const input = document.getElementById('hero-ai-search');
      if (!input) return;
  
      this._tickerInterval = setInterval(() => {
        const el = document.getElementById('hero-ai-search');
        if (!el) {
          clearInterval(this._tickerInterval);
          return;
        }
        idx = (idx + 1) % CampusConstants.heroSuggestions.length;
        el.placeholder = CampusConstants.heroSuggestions[idx];
      }, 3000);
    },
  
    // -----------------------------------------------------------------------
    // Initial Bootstrapping
    // -----------------------------------------------------------------------
    init() {
      // Read route from window hash if provided
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'assistant', 'campusMap', 'lostFound', 'spaces', 'events', 'profile', 'admin'].includes(hash)) {
        AppState.activeView = hash;
      }
  
      // Connect Realtime SSE for Study Spaces
      ApiClient.connectRealtime((payload) => {
        console.log('[UniPulse SSE Live Update]', payload);
        // Update AppState.spaces cache if present
        if (AppState.spaces && Array.isArray(AppState.spaces)) {
          const s = AppState.spaces.find(x => x.id === payload.space_id);
          if (s) {
            s.current_occupancy = payload.occupied;
            s.capacity = payload.total;
            s.occupancy_rate = payload.occupancy_rate;
            s.noise_level = payload.noise_level;
          }
        }
  
        // If we are currently looking at spaces view, update card
        const spaceEl = document.getElementById(`space-card-${payload.space_id}`);
        if (spaceEl) {
          const rate = payload.occupancy_rate;
          const bar = spaceEl.querySelector('.h-2\\.5');
          if (bar) {
            bar.style.width = `${rate}%`;
            bar.className = `${rate > 75 ? 'bg-amber-500' : rate > 45 ? 'bg-indigo-600' : 'bg-emerald-500'} h-2.5 rounded-full transition-all duration-500`;
          }
          const countEl = spaceEl.querySelector('.space-occupancy-count');
          if (countEl) countEl.innerText = `${payload.occupied} / ${payload.total}`;
          const rateEl = spaceEl.querySelector('.space-occupancy-rate');
          if (rateEl) {
            rateEl.innerText = `${rate}%`;
            rateEl.className = `space-occupancy-rate font-bold ${rate > 75 ? 'text-amber-600' : 'text-indigo-600'}`;
          }
          const availEl = spaceEl.querySelector('.space-available-desks');
          if (availEl) availEl.innerText = `${payload.available} Desks`;
        }
  
        // Update dashboard row if rendered
        const dashRow = document.getElementById(`dash-space-row-${payload.space_id}`);
        if (dashRow) {
          const bar = dashRow.querySelector('.h-2');
          if (bar) {
            bar.style.width = `${payload.occupancy_rate}%`;
            bar.className = `${payload.occupancy_rate > 75 ? 'bg-amber-500' : payload.occupancy_rate > 45 ? 'bg-indigo-600' : 'bg-emerald-500'} h-2 rounded-full transition-all duration-500`;
          }
          const occSpan = dashRow.querySelector('.dash-space-occ');
          if (occSpan) occSpan.innerText = `${payload.occupancy_rate}% full`;
          const deskSpan = dashRow.querySelector('.dash-space-desks');
          if (deskSpan) deskSpan.innerText = `${payload.available} desks available`;
        }
      });
  
      // Keyboard Shortcuts (⌘K and ESC)
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        }
        if (e.key === 'Escape') {
          this.closeModal();
        }
      });
  
      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (h && h !== AppState.activeView) {
          this.navigateTo(h);
        }
      });
  
      // Initial render
      this.render();
  
      // Preload initial datasets
      this.loadSpaces();
      this.loadLostItems();
      this.loadEvents();
  
      if (AppState.activeView === 'dashboard') {
        this.loadDashboard();
      } else if (AppState.activeView === 'admin') {
        this.loadAdmin();
      } else if (AppState.activeView === 'profile') {
        this.loadProfile();
      } else if (AppState.activeView === 'campusMap') {
        this.updateMapRoute();
      }
    }
  };
  
  // Auto-boot on DOM ready
  if (typeof window !== 'undefined') {
    window.UniPulse = UniPulse;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => UniPulse.init());
    } else {
      UniPulse.init();
    }
  }

})();