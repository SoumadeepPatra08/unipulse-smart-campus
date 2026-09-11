// =========================================================================
// UniPulse Authentication View: Responsive Glassmorphic Sign In & Registration
// =========================================================================

export function renderLogin() {
  return `
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div class="w-full max-w-md">
        <!-- Brand Header & Emblem -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-600/30 mb-3 border border-indigo-400/30">
            ⚡
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Uni<span class="text-indigo-600">Pulse</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">
            Smart Campus Companion • Secure Authentication
          </p>
        </div>

        <!-- Glassmorphism Auth Card -->
        <div class="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <!-- Ambient Card Accent -->
          <div class="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Auth Mode Toggle Tabs -->
          <div class="flex items-center p-1 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 mb-6 backdrop-blur-md">
            <button id="auth-tab-signin"
                    type="button"
                    onclick="UniPulse.switchAuthMode('signin')"
                    class="flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-xs bg-indigo-600 text-white">
              Sign In
            </button>
            <button id="auth-tab-register"
                    type="button"
                    onclick="UniPulse.switchAuthMode('register')"
                    class="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:text-slate-900 transition-all">
              Create Account
            </button>
          </div>

          <!-- Dynamic Alert Box (Success / Error) -->
          <div id="auth-alert" class="hidden mb-5 p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 transition-all">
            <span id="auth-alert-icon" class="text-base leading-none">⚠️</span>
            <span id="auth-alert-msg" class="flex-1 leading-relaxed"></span>
          </div>

          <!-- Sign In Form -->
          <form id="signin-form" onsubmit="UniPulse.handleLoginSubmit(event)" class="space-y-4">
            <div>
              <label for="signin-email" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Campus Email Address <span class="text-rose-500">*</span>
              </label>
              <input id="signin-email"
                     type="email"
                     autocomplete="email"
                     placeholder="alex@campus.edu"
                     class="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="signin-email-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="signin-password" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password <span class="text-rose-500">*</span>
                </label>
              </div>
              <input id="signin-password"
                     type="password"
                     autocomplete="current-password"
                     placeholder="••••••••"
                     class="w-full px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="signin-password-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <button id="signin-btn"
                    type="submit"
                    class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2">
              <span>Sign In to UniPulse</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" onsubmit="UniPulse.handleRegisterSubmit(event)" class="space-y-3.5 hidden">
            <div>
              <label for="reg-name" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span class="text-rose-500">*</span>
              </label>
              <input id="reg-name"
                     type="text"
                     autocomplete="name"
                     placeholder="Alex Rivera"
                     class="w-full px-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="reg-name-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <div>
              <label for="reg-email" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Campus Email <span class="text-rose-500">*</span>
              </label>
              <input id="reg-email"
                     type="email"
                     autocomplete="email"
                     placeholder="student@campus.edu"
                     class="w-full px-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="reg-email-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="reg-student-id" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Student ID <span class="text-slate-400 text-[10px] font-normal">(optional)</span>
                </label>
                <input id="reg-student-id"
                       type="text"
                       placeholder="CS-2027-1234"
                       class="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs focus:outline-none transition-all">
              </div>

              <div>
                <label for="reg-major" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Major <span class="text-slate-400 text-[10px] font-normal">(optional)</span>
                </label>
                <input id="reg-major"
                       type="text"
                       placeholder="Computer Science"
                       class="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs focus:outline-none transition-all">
              </div>
            </div>

            <div>
              <label for="reg-password" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Create Password <span class="text-rose-500">*</span>
              </label>
              <input id="reg-password"
                     type="password"
                     autocomplete="new-password"
                     placeholder="Min. 6 characters"
                     class="w-full px-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="reg-password-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <div>
              <label for="reg-confirm-password" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password <span class="text-rose-500">*</span>
              </label>
              <input id="reg-confirm-password"
                     type="password"
                     autocomplete="new-password"
                     placeholder="Re-enter your password"
                     class="w-full px-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none transition-all">
              <div id="reg-confirm-error" class="text-[11px] text-rose-500 font-medium mt-1 hidden"></div>
            </div>

            <button id="reg-btn"
                    type="submit"
                    class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2">
              <span>Create Free Account</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          </form>

          <!-- Quick Fill Demo Accounts -->
          <div class="mt-6 pt-5 border-t border-white/30 dark:border-white/10 text-center">
            <div class="text-[11px] font-semibold text-slate-400 mb-2">
              Quick Sign In with Demo Accounts:
            </div>
            <div class="flex items-center justify-center gap-2 flex-wrap">
              <button type="button"
                      onclick="UniPulse.fillDemoAccount('alex@campus.edu', 'alex123')"
                      class="px-3 py-1 rounded-xl glass-pill text-[11px] font-bold text-indigo-700 hover:border-indigo-400 transition-all">
                🎓 Alex Rivera (Student)
              </button>
              <button type="button"
                      onclick="UniPulse.fillDemoAccount('admin@campus.edu', 'admin123')"
                      class="px-3 py-1 rounded-xl glass-pill text-[11px] font-bold text-purple-700 hover:border-purple-400 transition-all">
                🛡️ Dr. Sarah Chen (Admin)
              </button>
            </div>
          </div>
        </div>

        <!-- Privacy & Protection Footnote -->
        <p class="text-center text-[11px] text-slate-400 mt-4">
          Protected with bcrypt password encryption & HTTP-only JWT security cookies.
        </p>
      </div>
    </div>
  `;
}
