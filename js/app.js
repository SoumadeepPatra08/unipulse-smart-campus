// =========================================================================
// UniPulse SPA Orchestrator, Event Controller, and Global State Router
// =========================================================================

export const UniPulse = {
  // Navigation Router & Route Guard
  navigateTo(viewName) {
    if (!AppState.isAuthenticated && viewName !== 'login') {
      viewName = 'login';
    } else if (AppState.isAuthenticated && viewName === 'login') {
      viewName = 'dashboard';
    }

    AppState.activeView = viewName;
    window.location.hash = viewName;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'login') return;

    // Fetch view specific fresh data
    if (viewName === 'dashboard') this.loadDashboard();
    if (viewName === 'spaces') this.loadSpaces();
    if (viewName === 'lostFound') this.loadLostItems();
    if (viewName === 'events') this.loadEvents();
    if (viewName === 'profile') this.loadProfile();
    if (viewName === 'admin') this.loadAdmin();
    if (viewName === 'campusMap') this.updateMapRoute();
  },

  // -----------------------------------------------------------------------
  // Authentication & Session Management
  // -----------------------------------------------------------------------
  switchAuthMode(mode) {
    const signinForm = document.getElementById('signin-form');
    const registerForm = document.getElementById('register-form');
    const tabSignin = document.getElementById('auth-tab-signin');
    const tabRegister = document.getElementById('auth-tab-register');
    this.clearAuthAlert();
    this.clearAuthErrors();

    if (mode === 'register') {
      AppState.authMode = 'register';
      if (signinForm) signinForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
      if (tabSignin) {
        tabSignin.className = 'flex-1 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:text-slate-900 transition-all';
      }
      if (tabRegister) {
        tabRegister.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-xs bg-indigo-600 text-white';
      }
    } else {
      AppState.authMode = 'signin';
      if (registerForm) registerForm.classList.add('hidden');
      if (signinForm) signinForm.classList.remove('hidden');
      if (tabRegister) {
        tabRegister.className = 'flex-1 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:text-slate-900 transition-all';
      }
      if (tabSignin) {
        tabSignin.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-xs bg-indigo-600 text-white';
      }
    }
  },

  setAuthAlert(type, message) {
    const alertEl = document.getElementById('auth-alert');
    const msgEl = document.getElementById('auth-alert-msg');
    const iconEl = document.getElementById('auth-alert-icon');
    if (!alertEl || !msgEl) return;

    alertEl.className = `mb-5 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 transition-all ${
      type === 'error'
        ? 'bg-rose-50/90 text-rose-800 border border-rose-200'
        : 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
    }`;
    if (iconEl) iconEl.innerText = type === 'error' ? '⚠️' : '✅';
    msgEl.innerText = message;
  },

  clearAuthAlert() {
    const alertEl = document.getElementById('auth-alert');
    if (alertEl) alertEl.classList.add('hidden');
  },

  clearAuthErrors() {
    const errorEls = document.querySelectorAll('[id$="-error"]');
    errorEls.forEach(el => {
      el.innerText = '';
      el.classList.add('hidden');
    });
    const inputs = document.querySelectorAll('.glass-input');
    inputs.forEach(inp => {
      inp.classList.remove('border-rose-500', 'ring-1', 'ring-rose-400');
    });
  },

  showFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    if (field) {
      field.classList.add('border-rose-500', 'ring-1', 'ring-rose-400');
      field.focus();
    }
    if (errorEl) {
      errorEl.innerText = message;
      errorEl.classList.remove('hidden');
    }
  },

  fillDemoAccount(email, password) {
    this.switchAuthMode('signin');
    const emailInput = document.getElementById('signin-email');
    const passInput = document.getElementById('signin-password');
    if (emailInput) emailInput.value = email;
    if (passInput) passInput.value = password;
    this.clearAuthErrors();
    this.clearAuthAlert();
  },

  async handleLoginSubmit(event) {
    if (event) event.preventDefault();
    this.clearAuthErrors();
    this.clearAuthAlert();

    const emailInput = document.getElementById('signin-email');
    const passInput = document.getElementById('signin-password');
    const btn = document.getElementById('signin-btn');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value : '';

    let hasError = false;
    if (!email) {
      this.showFieldError('signin-email', 'signin-email-error', 'Email address is required.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showFieldError('signin-email', 'signin-email-error', 'Please enter a valid campus email address.');
      hasError = true;
    }

    if (!password) {
      this.showFieldError('signin-password', 'signin-password-error', 'Password is required.');
      hasError = true;
    }

    if (hasError) return;

    // Loading button state
    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Signing in...`;
    }

    try {
      const res = await ApiClient.post('/auth/login', { email, password });
      AppState.user = res.user;
      AppState.token = res.token;
      AppState.isAuthenticated = true;
      if (res.token) {
        localStorage.setItem('unipulse_token', res.token);
      }
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      this.navigateTo('dashboard');
    } catch (err) {
      const errMsg = err.message || 'Invalid email or password. Please try again.';
      this.setAuthAlert('error', errMsg);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
    }
  },

  async handleRegisterSubmit(event) {
    if (event) event.preventDefault();
    this.clearAuthErrors();
    this.clearAuthAlert();

    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const studentIdInput = document.getElementById('reg-student-id');
    const majorInput = document.getElementById('reg-major');
    const passInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm-password');
    const btn = document.getElementById('reg-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const student_id = studentIdInput ? studentIdInput.value.trim() : '';
    const major = majorInput ? majorInput.value.trim() : '';
    const password = passInput ? passInput.value : '';
    const confirmPassword = confirmInput ? confirmInput.value : '';

    let hasError = false;
    if (!name) {
      this.showFieldError('reg-name', 'reg-name-error', 'Full name is required.');
      hasError = true;
    }

    if (!email) {
      this.showFieldError('reg-email', 'reg-email-error', 'Campus email address is required.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showFieldError('reg-email', 'reg-email-error', 'Please enter a valid campus email address.');
      hasError = true;
    }

    if (!password) {
      this.showFieldError('reg-password', 'reg-password-error', 'Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      this.showFieldError('reg-password', 'reg-password-error', 'Password must be at least 6 characters long.');
      hasError = true;
    }

    if (password && confirmPassword !== password) {
      this.showFieldError('reg-confirm-password', 'reg-confirm-error', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    // Loading button state
    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Creating account...`;
    }

    try {
      const res = await ApiClient.post('/auth/register', {
        name,
        email,
        password,
        student_id: student_id || null,
        major: major || null
      });
      AppState.user = res.user;
      AppState.token = res.token;
      AppState.isAuthenticated = true;
      if (res.token) {
        localStorage.setItem('unipulse_token', res.token);
      }
      showToast(`Account created! Welcome to UniPulse, ${res.user.name}!`, 'success');
      this.navigateTo('dashboard');
    } catch (err) {
      const isDuplicate = err.status === 409 || (err.message && err.message.toLowerCase().includes('already exists'));
      const errMsg = isDuplicate
        ? 'An account with this email already exists. Please sign in instead.'
        : (err.message || 'Registration failed. Please check your information and try again.');
      this.setAuthAlert('error', errMsg);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
    }
  },

  async handleLogout() {
    try {
      await ApiClient.post('/auth/logout');
    } catch (e) {
      // Continue client cleanup even if network fails
    }
    AppState.user = null;
    AppState.token = null;
    AppState.isAuthenticated = false;
    localStorage.removeItem('unipulse_token');
    showToast('Signed out successfully.', 'info');
    this.navigateTo('login');
  },

  async checkAuthSession() {
    try {
      const user = await ApiClient.get('/auth/me');
      if (user && user.id) {
        AppState.user = user;
        AppState.isAuthenticated = true;
        return true;
      }
    } catch (e) {
      // Unauthorized or session expired
    }
    AppState.user = null;
    AppState.isAuthenticated = false;
    return false;
  },

  // Switch between Student and Administrator
  async toggleRole() {
    const isCurrentlyStudent = AppState.user && AppState.user.role === 'student';
    const newRole = isCurrentlyStudent ? 'admin' : 'student';

    try {
      // Authenticate as the respective demo account
      const loginPayload = isCurrentlyStudent
        ? { email: 'admin@campus.edu', password: 'admin123' }
        : { email: 'alex@campus.edu', password: 'alex123' };

      const res = await ApiClient.post('/auth/login', loginPayload);
      AppState.user = res.user;
      AppState.token = res.token;
      AppState.isAuthenticated = true;
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

    if (AppState.activeView === 'login' || !AppState.isAuthenticated) {
      root.innerHTML = `
        <div class="min-h-screen flex flex-col justify-between">
          <main class="flex-1 flex items-center justify-center p-4">
            ${renderLogin()}
          </main>
        </div>
        <div id="modal-root"></div>
        <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"></div>
      `;
      return;
    }

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
  async init() {
    // Read route from window hash if provided
    const hash = window.location.hash.replace('#', '');

    // Check existing auth session via HTTP-only cookie or stored JWT
    const isAuthenticated = await this.checkAuthSession();

    if (!isAuthenticated) {
      this.navigateTo('login');
    } else {
      if (hash && ['dashboard', 'assistant', 'campusMap', 'lostFound', 'spaces', 'events', 'profile', 'admin'].includes(hash)) {
        this.navigateTo(hash);
      } else {
        this.navigateTo('dashboard');
      }
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
  }
};

// Auto-boot on DOM ready
if (typeof window !== 'undefined') {
  window.UniPulse = UniPulse;
  window.AppState = AppState;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UniPulse.init());
  } else {
    UniPulse.init();
  }
}
