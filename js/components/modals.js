// =========================================================================
// UniPulse Modal Dialogs: Report Intake, 91% Match Analysis, Desk Pass, ⌘K
// =========================================================================

export function getModalRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

export function closeModal() {
  const root = getModalRoot();
  root.innerHTML = '';
}

// -------------------------------------------------------------------------
// 1. Report Lost / Found Item Modal with Image Upload
// -------------------------------------------------------------------------
export function openReportModal(kind = 'lost') {
  const root = getModalRoot();
  const isLost = kind === 'lost';

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div class="glass-modal max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center ${isLost ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} font-bold">
            ${isLost ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'}
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900">${isLost ? 'Report Lost Belonging' : 'Report Found Belonging'}</h3>
            <p class="text-xs text-slate-500">AI similarity search triggers automatically upon submission</p>
          </div>
        </div>

        <form id="report-item-form" class="space-y-4" onsubmit="UniPulse.handleReportSubmit(event, '${kind}')">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Item Title *</label>
            <input id="report-title" required type="text" placeholder="e.g. Hydro Flask Navy Blue 32oz, Lenovo ThinkPad Charger"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select id="report-category" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600">
                <option value="Bottles & Containers">Bottles & Containers</option>
                <option value="Electronics">Electronics & Laptops</option>
                <option value="Keys & Cards">Keys & Campus IDs</option>
                <option value="Bags & Backpacks">Bags & Backpacks</option>
                <option value="Books & Notes">Books & Stationery</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Campus Location</label>
              <select id="report-location" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600">
                <option value="lib">Main Library</option>
                <option value="b34">Block 34 (Engineering)</option>
                <option value="sport">Sports Complex</option>
                <option value="sc">Student Commons</option>
                <option value="inn">Innovation Hub</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Distinct Features / Description</label>
            <textarea id="report-description" rows="3" placeholder="Colors, stickers, scratches, exact room or desk number..."
              class="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"></textarea>
          </div>

          <!-- Drag and Drop Image Intake -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Item Photo (Optional for Vision AI)</label>
            <div class="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 transition-colors"
                 onclick="document.getElementById('report-photo-input').click()">
              <input type="file" id="report-photo-input" accept="image/*" class="hidden" onchange="UniPulse.handlePhotoUploadPreview(this)">
              <div id="photo-preview-container" class="flex flex-col items-center">
                <svg class="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span class="text-xs text-slate-600 font-medium">Click to upload or drag photo here</span>
                <span class="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</span>
              </div>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onclick="UniPulse.closeModal()">
              Cancel
            </button>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
              <span>Submit & Match</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// 2. Flagship 91% AI Match Side-by-Side Analysis Modal
// -------------------------------------------------------------------------
export async function openMatchAnalysisModal(matchId = 'match-91') {
  const root = getModalRoot();

  // Show loading skeleton
  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="glass-modal max-w-3xl w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm font-semibold text-slate-700">Loading AI Multi-Factor Match Analysis...</p>
      </div>
    </div>
  `;

  let match;
  try {
    match = await ApiClient.get(`/items/${matchId}/matches`);
  } catch (e) {
    showToast('Could not load match analysis', 'error');
    closeModal();
    return;
  }

  const score = match.confidence_score || 91.0;
  const factors = match.match_factors || {};

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div class="glass-modal max-w-3xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Header with Confidence Pill -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
                High Confidence Candidate
              </span>
              <span class="text-xs text-slate-400">Match ID: ${match.id}</span>
            </div>
            <h3 class="text-2xl font-bold text-slate-900">Side-by-Side AI Match Analysis</h3>
          </div>

          <!-- Circular Score Badge -->
          <div class="flex items-center gap-3 bg-indigo-50/80 border border-indigo-100 px-4 py-2 rounded-2xl">
            <div class="relative w-12 h-12 flex items-center justify-center">
              <svg class="w-12 h-12" viewBox="0 0 36 36">
                <path class="text-slate-200" stroke-width="3" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-indigo-600 score-circle" stroke-dasharray="${score}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="absolute text-xs font-black text-indigo-700">${Math.round(score)}%</span>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Overall Match</div>
              <div class="text-sm font-bold text-indigo-900">${score}% AI Match</div>
            </div>
          </div>
        </div>

        <!-- Side-by-Side Comparison Columns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <!-- Lost Item Card -->
          <div class="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">Reported Lost (Yours)</span>
              <span class="text-[11px] text-slate-500">${match.lost_item.date}</span>
            </div>
            <img src="${match.lost_item.image_url}" alt="Lost item" class="w-full h-40 object-cover rounded-xl mb-3 shadow-xs">
            <h4 class="font-bold text-slate-900 text-sm">${match.lost_item.title}</h4>
            <p class="text-xs text-slate-600 mt-1">${match.lost_item.description}</p>
            <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
              <span>Main Library (Level 2)</span>
            </div>
          </div>

          <!-- Found Item Card -->
          <div class="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Turned In at Campus Desk</span>
              <span class="text-[11px] text-slate-500">${match.found_item.date}</span>
            </div>
            <img src="${match.found_item.image_url}" alt="Found item" class="w-full h-40 object-cover rounded-xl mb-3 shadow-xs">
            <h4 class="font-bold text-slate-900 text-sm">${match.found_item.title}</h4>
            <p class="text-xs text-slate-600 mt-1">${match.found_item.description}</p>
            <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
              <span>${match.desk_location}</span>
            </div>
          </div>
        </div>

        <!-- Explainable Multi-Factor Checklist -->
        <div class="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 mb-6">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Explainable AI Factor Breakdown
          </h5>

          <div class="space-y-2.5">
            ${Object.entries(factors).map(([k, f]) => `
              <div class="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span class="font-medium text-slate-700">${f.description}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-slate-400">${Math.round(f.weight * 100)}% wt</span>
                  <span class="font-bold text-slate-900">${f.score}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Action Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div class="text-xs text-slate-500">
            Physical Item Location: <strong class="text-slate-800">${match.desk_location}</strong>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50" onclick="UniPulse.closeModal()">
              Close
            </button>
            ${match.status === 'claimed' ? `
              <span class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                <span>✓</span>
                <span>Claim Dispatched to Desk</span>
              </span>
            ` : `
              <button class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      onclick="UniPulse.handleClaimDispatch('${match.id}')">
                <span>Dispatch Claim to Desk</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// 3. Instant Desk Reservation Modal
// -------------------------------------------------------------------------
export function openReserveModal(spaceId, spaceName) {
  const root = getModalRoot();

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div class="glass-modal max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1" onclick="UniPulse.closeModal()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900">Reserve Study Desk</h3>
            <p class="text-xs text-slate-500">${spaceName}</p>
          </div>
        </div>

        <form onsubmit="UniPulse.handleReserveSubmit(event, '${spaceId}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Select Desk Number</label>
            <select id="reserve-desk-select" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono">
              <option value="D-102">Desk D-102 (Window / Dual Power)</option>
              <option value="D-104">Desk D-104 (Quiet Corner / Power)</option>
              <option value="D-109">Desk D-109 (Center Cubicle / Lamp)</option>
              <option value="D-115">Desk D-115 (Standing Desk Option)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Reservation Window</label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" class="duration-pill active py-2 rounded-xl border border-indigo-600 bg-indigo-50 text-indigo-700 text-xs font-bold" onclick="UniPulse.selectDuration(this, 30)">30 Mins</button>
              <button type="button" class="duration-pill py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300" onclick="UniPulse.selectDuration(this, 45)">45 Mins</button>
              <button type="button" class="duration-pill py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300" onclick="UniPulse.selectDuration(this, 60)">60 Mins</button>
            </div>
            <input type="hidden" id="reserve-duration" value="30">
          </div>

          <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-xs text-slate-600">
            <svg class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Pass holds desk for 15 minutes past start time before releasing to waiting students.</span>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50" onclick="UniPulse.closeModal()">
              Cancel
            </button>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
              <span>Issue Digital Pass</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// 4. Global Command Palette (⌘K / Ctrl+K)
// -------------------------------------------------------------------------
export function openCommandPalette() {
  const root = getModalRoot();

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onclick="if(event.target === this) UniPulse.closeModal()">
      <div class="glass-modal max-w-xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh]">
        <!-- Search Input Bar -->
        <div class="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <svg class="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input id="cmd-k-input" type="text" placeholder="Type a command, building, or search campus items..."
                 class="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                 oninput="UniPulse.handleCommandSearch(this.value)">
          <kbd class="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">ESC</kbd>
        </div>

        <!-- Search Results List -->
        <div id="cmd-k-results" class="p-2 overflow-y-auto space-y-1">
          <!-- Initial Quick Actions -->
          <div class="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</div>
          <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors text-left group" onclick="UniPulse.navigateTo('spaces'); UniPulse.closeModal()">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">⚡</div>
              <div>
                <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-900">Reserve Quiet Study Desk</div>
                <div class="text-[11px] text-slate-400">Main Library Level 3 or Block 34</div>
              </div>
            </div>
            <span class="text-[10px] text-slate-400">Spaces</span>
          </button>

          <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 transition-colors text-left group" onclick="UniPulse.openReportModal('lost');">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">🔍</div>
              <div>
                <div class="text-xs font-semibold text-slate-800 group-hover:text-amber-900">Report Lost Belonging</div>
                <div class="text-[11px] text-slate-400">Submit photos and run AI matching</div>
              </div>
            </div>
            <span class="text-[10px] text-slate-400">Lost & Found</span>
          </button>

          <button class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors text-left group" onclick="UniPulse.navigateTo('campusMap'); UniPulse.closeModal()">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">🗺️</div>
              <div>
                <div class="text-xs font-semibold text-slate-800 group-hover:text-indigo-900">Interactive Campus Map</div>
                <div class="text-[11px] text-slate-400">Walking routes, hours, and facilities</div>
              </div>
            </div>
            <span class="text-[10px] text-slate-400">Finder</span>
          </button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const input = document.getElementById('cmd-k-input');
    if (input) input.focus();
  }, 50);
}
