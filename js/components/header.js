// =========================================================================
// UniPulse Top Navigation Bar: Search trigger, beacon, notifications
// =========================================================================

export function renderHeader() {
  return `
    <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-6 flex items-center justify-between">
      <!-- Left: Campus Beacon & Breadcrumbs -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 beacon-pulse"></span>
          <span>Main Campus Online</span>
        </div>
        <span class="hidden sm:inline text-xs text-slate-400 font-medium">• Term Fall '26</span>
      </div>

      <!-- Center: ⌘K Global Search Trigger Bar -->
      <div class="flex-1 max-w-md mx-6">
        <div onclick="UniPulse.openCommandPalette()"
             class="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 text-slate-500 text-xs font-medium cursor-pointer transition-colors shadow-2xs">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <span>Search spaces, routes, lost belongings...</span>
          </div>
          <kbd class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span>⌘</span><span>K</span>
          </kbd>
        </div>
      </div>

      <!-- Right: Action Buttons & Notifications -->
      <div class="flex items-center gap-3">
        <!-- Notification Bell -->
        <div class="relative">
          <button class="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors relative"
                  onclick="UniPulse.toggleNotificationFlyout()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            ${AppState.unreadNotifications > 0 ? `
              <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                ${AppState.unreadNotifications}
              </span>
            ` : ''}
          </button>

          <!-- Notifications Dropdown -->
          <div id="notification-flyout" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
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
