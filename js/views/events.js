// =========================================================================
// UniPulse Campus Events & Hackathons Discovery View
// =========================================================================

export function renderEvents() {
  return `
    <div class="space-y-6 animate-fadeIn pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Campus Events & Hackathons</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Personalized recommendations tailored to your Computer Science academic profile.</p>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button onclick="UniPulse.filterEvents('all', this)" class="event-filter-tab active px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          All Events
        </button>
        <button onclick="UniPulse.filterEvents('Tech', this)" class="event-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200">
          Tech & AI
        </button>
        <button onclick="UniPulse.filterEvents('Engineering', this)" class="event-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200">
          Engineering & Robotics
        </button>
        <button onclick="UniPulse.filterEvents('Workshops', this)" class="event-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200">
          Workshops
        </button>
        <button onclick="UniPulse.filterEvents('Cultural', this)" class="event-filter-tab px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200">
          Cultural & Social
        </button>
      </div>

      <!-- Events Cards Grid -->
      <div id="events-feed-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Rendered dynamically by app.js from ApiClient.get('/events') -->
        <div class="p-8 text-center col-span-2 text-slate-400 text-xs">Loading campus events...</div>
      </div>
    </div>
  `;
}
