// =========================================================================
// UniPulse Avatar Picker & Image Crop/Preview Component
// Supports 16 diverse built-in vector avatars + interactive HTML5 Canvas cropper
// =========================================================================

export const BUILTIN_AVATARS = [
  { id: 'avatar-01', name: 'Alex', role: 'Tech & Code', url: '/assets/avatars/avatar-01.svg', tag: 'Engineering' },
  { id: 'avatar-02', name: 'Sarah', role: 'Research & Scholar', url: '/assets/avatars/avatar-02.svg', tag: 'Science' },
  { id: 'avatar-03', name: 'Jordan', role: 'Design & Media', url: '/assets/avatars/avatar-03.svg', tag: 'Design' },
  { id: 'avatar-04', name: 'Maya', role: 'Bio & Health', url: '/assets/avatars/avatar-04.svg', tag: 'Medicine' },
  { id: 'avatar-05', name: 'Liam', role: 'Robotics & AI', url: '/assets/avatars/avatar-05.svg', tag: 'Robotics' },
  { id: 'avatar-06', name: 'Chloe', role: 'Arts & Literature', url: '/assets/avatars/avatar-06.svg', tag: 'Humanities' },
  { id: 'avatar-07', name: 'Ethan', role: 'Engineering', url: '/assets/avatars/avatar-07.svg', tag: 'Mechanical' },
  { id: 'avatar-08', name: 'Zara', role: 'Data & Analytics', url: '/assets/avatars/avatar-08.svg', tag: 'Data Science' },
  { id: 'avatar-09', name: 'Noah', role: 'Athletics & Sports', url: '/assets/avatars/avatar-09.svg', tag: 'Athletics' },
  { id: 'avatar-10', name: 'Emma', role: 'Math & Physics', url: '/assets/avatars/avatar-10.svg', tag: 'Mathematics' },
  { id: 'avatar-11', name: 'Leo', role: 'Campus Operations', url: '/assets/avatars/avatar-11.svg', tag: 'Operations' },
  { id: 'avatar-12', name: 'Aria', role: 'Music & Audio', url: '/assets/avatars/avatar-12.svg', tag: 'Music' },
  { id: 'avatar-13', name: 'Kai', role: 'Cybersecurity', url: '/assets/avatars/avatar-13.svg', tag: 'Security' },
  { id: 'avatar-14', name: 'Sora', role: 'Eco & Sustainability', url: '/assets/avatars/avatar-14.svg', tag: 'Ecology' },
  { id: 'avatar-15', name: 'Ravi', role: 'Astrophysics', url: '/assets/avatars/avatar-15.svg', tag: 'Astronomy' },
  { id: 'avatar-16', name: 'Elena', role: 'Business & Venture', url: '/assets/avatars/avatar-16.svg', tag: 'Business' }
];

export function renderAvatarPickerGrid(currentAvatarUrl) {
  return `
    <div class="grid grid-cols-4 sm:grid-cols-8 gap-3">
      ${BUILTIN_AVATARS.map(avatar => {
        const isSelected = currentAvatarUrl === avatar.url;
        return `
          <button type="button"
                  onclick="UniPulse.selectBuiltInAvatar('${avatar.url}')"
                  class="group relative flex flex-col items-center p-2 rounded-2xl transition-all duration-200 border text-center ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white/60 hover:bg-white/90 border-white/80 hover:border-indigo-300 shadow-2xs hover:scale-105'
                  }"
                  title="${avatar.name} — ${avatar.role}">
            <div class="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs">
              <img src="${avatar.url}" alt="${avatar.name}" class="w-full h-full object-cover">
              ${isSelected ? `
                <div class="absolute inset-0 bg-indigo-600/30 backdrop-blur-2xs flex items-center justify-center">
                  <div class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </div>
                </div>
              ` : ''}
            </div>
            <span class="mt-1.5 text-[10px] font-bold text-slate-700 truncate w-full group-hover:text-indigo-600">
              ${avatar.name.split(' ')[0]}
            </span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

export function renderCropModal() {
  return `
    <div id="crop-modal-overlay" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div class="glass-modal rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden border border-white/80">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ✂️
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Crop & Adjust Profile Picture</h3>
              <p class="text-[11px] text-slate-500">Drag to reposition, slider to zoom</p>
            </div>
          </div>
          <button onclick="UniPulse.closeCropModal()" class="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
            ✕
          </button>
        </div>

        <!-- Canvas Area & Preview Side-by-Side -->
        <div class="flex flex-col sm:flex-row items-center gap-6 justify-center my-2">
          <!-- Crop Canvas -->
          <div class="relative w-64 h-64 rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 flex items-center justify-center select-none">
            <canvas id="avatar-crop-canvas" width="256" height="256" class="cursor-move"></canvas>
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="w-48 h-48 rounded-full border-2 border-dashed border-white/80 shadow-2xl"></div>
            </div>
          </div>

          <!-- Live Circular Preview -->
          <div class="flex flex-col items-center text-center">
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Live Preview</div>
            <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-lg p-0.5 bg-white">
              <canvas id="avatar-crop-preview" width="96" height="96" class="w-full h-full rounded-full"></canvas>
            </div>
            <span class="text-[10px] text-slate-400 mt-2 font-medium">1:1 Circular Avatar</span>
          </div>
        </div>

        <!-- Controls: Zoom Slider -->
        <div class="mt-5 px-2">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Zoom</span>
            <span id="crop-zoom-label" class="font-mono text-indigo-600 font-bold">1.0x</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">🔍 -</span>
            <input id="crop-zoom-slider"
                   type="range"
                   min="1"
                   max="3"
                   step="0.05"
                   value="1"
                   oninput="UniPulse.updateCropZoom(this.value)"
                   class="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer">
            <span class="text-xs text-slate-400">+ 🔍</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200/60">
          <button type="button"
                  onclick="UniPulse.closeCropModal()"
                  class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all">
            Cancel
          </button>
          <button id="save-crop-btn"
                  type="button"
                  onclick="UniPulse.applyAndUploadCroppedAvatar()"
                  class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2">
            <span>Save & Apply Avatar</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}
