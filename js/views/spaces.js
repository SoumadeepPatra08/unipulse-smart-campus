// =========================================================================
// UniPulse Live Study Spaces: Real-time Occupancy Meters & Instant Booking
// =========================================================================

export function renderSpaces() {
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
