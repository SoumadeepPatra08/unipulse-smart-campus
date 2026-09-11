// =========================================================================
// UniPulse Admin Console: Campus KPIs, Velocity Charts, Staff Audit Queue
// =========================================================================

export function renderAdmin() {
  return `
    <div class="space-y-6 animate-fadeIn pb-12">
      <!-- Top Title & Badge -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
              Staff Clearance Active
            </span>
            <span class="text-xs text-slate-400">Lead: Dr. Sarah Chen</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Operations Administration Console</h1>
        </div>

        <button onclick="UniPulse.toggleRole()"
                class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs">
          Return to Student View
        </button>
      </div>

      <!-- Campus KPI Highlights Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</div>
          <div id="admin-kpi-students" class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">14,820</div>
          <div class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>↑ 8.4%</span>
            <span class="text-slate-400">vs last term</span>
          </div>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Match Accuracy</div>
          <div id="admin-kpi-accuracy" class="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">94.2%</div>
          <div class="text-[11px] text-indigo-500 font-semibold mt-1">Computer vision & spatial</div>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Lost Reports</div>
          <div id="admin-kpi-reports" class="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">42</div>
          <div class="text-[11px] text-slate-500 font-medium mt-1">19 awaiting candidate pairs</div>
        </div>

        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-card">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved This Week</div>
          <div id="admin-kpi-resolved" class="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">89</div>
          <div class="text-[11px] text-emerald-600 font-semibold mt-1">Avg 3.4h resolution speed</div>
        </div>
      </div>

      <!-- Velocity Chart & Study Space Capacity Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Resolution Velocity SVG Chart (2 cols) -->
        <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Weekly Lost & Found Resolution Velocity</h3>
              <p class="text-xs text-slate-400">Daily intake vs confirmed student claim handoffs</p>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Resolved</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Reported</span>
            </div>
          </div>

          <!-- SVG Bar Chart -->
          <div id="admin-velocity-chart" class="h-56 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-100">
            ${[
              { day: 'Mon', res: 14, rep: 18 },
              { day: 'Tue', res: 19, rep: 21 },
              { day: 'Wed', res: 24, rep: 20 },
              { day: 'Thu', res: 22, rep: 25 },
              { day: 'Fri', res: 28, rep: 24 },
              { day: 'Sat', res: 12, rep: 10 },
              { day: 'Sun', res: 16, rep: 11 },
            ].map(d => `
              <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div class="w-full flex items-end justify-center gap-1 h-full">
                  <div class="w-3 sm:w-4 bg-slate-200 rounded-t-lg transition-all group-hover:bg-slate-300" style="height: ${d.rep * 3.4}px" title="${d.rep} Reported"></div>
                  <div class="w-3 sm:w-4 bg-indigo-600 rounded-t-lg transition-all group-hover:bg-indigo-700" style="height: ${d.res * 3.4}px" title="${d.res} Resolved"></div>
                </div>
                <span class="text-[11px] font-bold text-slate-500">${d.day}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Campus Space Capacity Distribution -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900 mb-1">Space Atmosphere Load</h3>
            <p class="text-xs text-slate-400 mb-4">Real-time aggregate occupancy across zones</p>

            <div id="admin-space-load" class="space-y-4">
              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">Silent Focus Floors</span>
                  <span class="text-indigo-600">78%</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-2 rounded-full" style="width: 78%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">Quiet Pods</span>
                  <span class="text-indigo-600">52%</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 52%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">Moderate Labs (Block 34)</span>
                  <span class="text-indigo-600">42%</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-indigo-500 h-2 rounded-full" style="width: 42%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">Collaborative Lounges</span>
                  <span class="text-indigo-600">81%</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-pink-500 h-2 rounded-full" style="width: 81%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Data refreshed live from SQLite sensor feeds
          </div>
        </div>
      </div>

      <!-- Staff Audit & Verification Queue Table -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900">AI Match Verification & Audit Queue</h3>
            <p class="text-xs text-slate-500">Staff review required before releasing high-value items for student in-person pickup</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            1 Pending Staff Action
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th class="py-3.5 px-6">Match ID & Candidate</th>
                <th class="py-3.5 px-6">Confidence Score</th>
                <th class="py-3.5 px-6">Student Info</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-audit-table-body" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered dynamically by app.js from ApiClient.get('/admin/audit-queue') -->
              <tr>
                <td colspan="5" class="py-6 text-center text-slate-400">Loading audit queue...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
