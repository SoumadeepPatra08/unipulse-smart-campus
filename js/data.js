// =========================================================================
// UniPulse Core State Store & REST / SSE API Client
// =========================================================================

const API_BASE = '/api';

export const AppState = {
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

export const CampusConstants = {
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
export const ApiClient = {
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
export function subscribeState(callback) {
  AppState.subscribers.push(callback);
}

export function notifyStateChange(viewName) {
  AppState.subscribers.forEach(fn => fn(viewName || AppState.activeView));
}
