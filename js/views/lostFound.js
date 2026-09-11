// =========================================================================
// UniPulse Smart Lost & Found: Intake CTAs, Live Feed, 91% AI Match Hub
// =========================================================================

export function renderLostFound() {
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
