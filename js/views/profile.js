// =========================================================================
// UniPulse Student Profile & Preferences View
// Supports Profile Customization, Display Name Editing, Avatar Upload & Built-In Picker
// =========================================================================

import { renderAvatarPickerGrid } from '../components/avatarPicker.js';

export function renderProfile() {
  const u = AppState.user || {
    name: 'Campus Student',
    role: 'student',
    major: 'Computer Science',
    grad_year: "'27",
    student_id: 'CS-2027-0000',
    email: 'student@campus.edu',
    interests: [],
    avatar_url: '/assets/avatars/avatar-01.svg'
  };

  return `
    <div class="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <!-- Profile Header Card -->
      <div class="glass-card rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex items-center gap-5 relative z-10">
          <div class="relative group">
            <img id="profile-header-avatar" src="${u.avatar_url}" alt="${u.name}"
                 class="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md transition-transform group-hover:scale-105">
            <button type="button"
                    onclick="document.getElementById('avatar-file-input').click()"
                    title="Upload new picture"
                    class="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-indigo-700 transition-all">
              📷
            </button>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 id="profile-display-name-header" class="text-2xl font-extrabold text-slate-900">${u.name}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                ${u.role}
              </span>
            </div>
            <p class="text-sm font-semibold text-slate-600 mt-0.5">${u.major || 'Undergraduate'} • Class of ${u.grad_year || "'27"}</p>
            <div class="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
              <span>Student ID: <strong class="font-mono text-slate-700 font-bold">${u.student_id || 'N/A'}</strong></span>
              <span>•</span>
              <span class="flex items-center gap-1 text-slate-600">
                <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>${u.email}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 relative z-10 flex-wrap">
          <button onclick="UniPulse.toggleRole()"
                  class="px-4 py-2 rounded-xl glass-pill text-xs font-bold text-slate-700 transition-all shadow-2xs hover:border-indigo-300">
            Switch to ${u.role === 'admin' ? 'Student' : 'Admin'} Mode
          </button>
          <button onclick="UniPulse.handleLogout()"
                  class="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <!-- Profile Customization & Identity Settings -->
      <div class="glass-card rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-white/60">
          <div>
            <h3 class="text-base font-bold text-slate-900">Profile Customization & Settings</h3>
            <p class="text-xs text-slate-500 mt-0.5">Customize your display name, upload custom photos, or select a built-in avatar</p>
          </div>
          <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Identity Settings
          </span>
        </div>

        <!-- Alert Notification for Settings Updates -->
        <div id="profile-alert" class="hidden p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 transition-all">
          <span id="profile-alert-icon"></span>
          <span id="profile-alert-msg" class="flex-1"></span>
        </div>

        <!-- Section 1: Display Name & Email -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <form onsubmit="UniPulse.handleUpdateDisplayName(event)" class="space-y-2">
              <label for="profile-name-input" class="block text-xs font-bold text-slate-700">
                Display Name <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input id="profile-name-input"
                       type="text"
                       value="${u.name}"
                       placeholder="Your full name"
                       class="flex-1 px-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
                <button id="save-name-btn"
                        type="submit"
                        class="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all whitespace-nowrap">
                  Save Name
                </button>
              </div>
              <div id="profile-name-error" class="text-[11px] text-rose-500 font-medium hidden"></div>
            </form>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">
              Campus Email Address
            </label>
            <div class="px-4 py-2.5 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
              <span class="font-mono">${u.email}</span>
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Verified
              </span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Managed by campus identity provider</p>
          </div>
        </div>

        <!-- Section 2: Avatar Customization -->
        <div class="pt-6 border-t border-white/60 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Profile Picture</h4>
              <p class="text-xs text-slate-500">Upload a custom photo (JPG, PNG, WebP up to 5 MB) or pick a diverse built-in avatar</p>
            </div>

            <!-- Upload & Revert Buttons -->
            <div class="flex items-center gap-2">
              <!-- Hidden File Input -->
              <input id="avatar-file-input"
                     type="file"
                     accept="image/jpeg,image/png,image/webp"
                     onchange="UniPulse.handleAvatarFileSelected(event)"
                     class="hidden">

              <button type="button"
                      onclick="document.getElementById('avatar-file-input').click()"
                      class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <span>Upload Photo</span>
              </button>

              <button type="button"
                      onclick="UniPulse.handleRevertAvatar()"
                      title="Revert to built-in avatar"
                      class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Revert to Built-in</span>
              </button>
            </div>
          </div>

          <!-- Built-In Avatar Gallery (16 Avatars) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Choose from 16 Built-in Personas:</span>
              <span class="text-indigo-600 font-bold">1-Click Instant Apply</span>
            </div>
            ${renderAvatarPickerGrid(u.avatar_url)}
          </div>
        </div>
      </div>

      <!-- Academic Interests & Recommendation Personalization -->
      <div class="glass-card rounded-3xl p-6 shadow-card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Personalized Academic Interests</h3>
            <p class="text-xs text-slate-500">Powers your AI assistant and personalized event recommendations</p>
          </div>
          <span class="text-xs text-indigo-600 font-semibold">${(u.interests || []).length} Active Tags</span>
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
