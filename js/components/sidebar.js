// =========================================================================
// UniPulse Sidebar Navigation & Role Switcher
// =========================================================================

export function renderSidebar() {
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
