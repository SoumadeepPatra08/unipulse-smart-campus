// =========================================================================
// UniPulse Dashboard View: Rotating AI Hero Search, 91% Match Card, Snapshot
// =========================================================================

export function renderDashboard() {
  return `
    <div class="space-y-6 animate-fadeIn pb-12">
      <!-- Top Welcome Greeting -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="cursor-pointer" onclick="UniPulse.navigateTo('profile')" title="View profile settings">
            <img src="${AppState.user?.avatar_url || '/assets/avatars/avatar-01.svg'}" alt="User Avatar"
                 class="w-12 h-12 rounded-2xl object-cover border border-slate-200 ring-2 ring-indigo-100 hover:ring-indigo-300 transition-all shadow-sm">
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span class="text-indigo-600">${AppState.user?.name ? AppState.user.name.split(' ')[0] : 'Student'}</span> 👋
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Here is what is happening across your campus right now.</p>
          </div>
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
