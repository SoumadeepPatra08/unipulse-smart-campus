// =========================================================================
// UniPulse Student Profile & Preferences View
// =========================================================================

export function renderProfile() {
  const u = AppState.user;

  return `
    <div class="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <!-- Profile Header Card -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
          <img src="${u.avatar_url}" alt="Student Avatar" class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md">
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
                class="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shadow-2xs">
          Switch to ${u.role === 'admin' ? 'Student' : 'Admin'} Mode
        </button>
      </div>

      <!-- Academic Interests & Recommendation Personalization -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Personalized Academic Interests</h3>
            <p class="text-xs text-slate-500">Powers your AI assistant and personalized event recommendations</p>
          </div>
          <span class="text-xs text-indigo-600 font-semibold">4 Active Tags</span>
        </div>

        <div id="profile-interest-tags" class="flex flex-wrap gap-2 mb-4">
          ${(u.interests || []).map(tag => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <span>${tag}</span>
              <button onclick="UniPulse.removeInterest('${tag}')" class="text-indigo-400 hover:text-indigo-800">×</button>
            </span>
          `).join('')}
        </div>

        <!-- Add Tag Input -->
        <form onsubmit="UniPulse.handleAddInterest(event)" class="flex items-center gap-2 max-w-sm">
          <input id="new-interest-input" type="text" placeholder="Add interest (e.g. Design, Quantum)..."
                 class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <button type="submit" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">Add</button>
        </form>
      </div>

      <!-- Activity Timeline: Active Passes & Reports -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Active Passes -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
          <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>🎟️</span>
            <span>Active Desk Passes</span>
          </h3>
          <div id="profile-active-passes" class="space-y-3">
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-900">Main Library — Desk D-102</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1 font-mono">Pass: PASS-91B24A • Valid for 45 mins</div>
            </div>
          </div>
        </div>

        <!-- Submitted Reports -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
          <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>📦</span>
            <span>Your Campus Reports</span>
          </h3>
          <div id="profile-submitted-reports" class="space-y-3">
            <div class="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70">
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
