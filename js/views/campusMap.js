// =========================================================================
// UniPulse Campus Finder: Vector SVG Map & Animated Walking Route Polyline
// =========================================================================

export function renderCampusMap() {
  return `
    <div class="space-y-6 animate-fadeIn pb-12">
      <!-- Top Title & Route Selection Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Campus Finder</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Live pedestrian routes, facility hours, and SVG vector navigation.</p>
        </div>

        <!-- Quick Route Selector -->
        <div class="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold px-2">
            <span>From:</span>
            <select id="route-from-select" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none" onchange="UniPulse.updateMapRoute()">
              <option value="b34">Block 34 (Engineering)</option>
              <option value="lib">Main Library</option>
              <option value="sc">Student Commons</option>
              <option value="inn">Innovation Hub</option>
            </select>
          </div>
          <span class="text-slate-300">→</span>
          <div class="flex items-center gap-1.5 text-xs text-slate-600 font-semibold px-2">
            <span>To:</span>
            <select id="route-to-select" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none" onchange="UniPulse.updateMapRoute()">
              <option value="sport" selected>Sports Complex</option>
              <option value="lib">Main Library</option>
              <option value="b34">Block 34</option>
              <option value="sc">Student Commons</option>
            </select>
          </div>
          <button onclick="UniPulse.updateMapRoute()"
                  class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs">
            Route
          </button>
        </div>
      </div>

      <!-- Main Map Grid (SVG Map Canvas + Directory Details) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- SVG Vector Campus Canvas (2 cols) -->
        <div class="lg:col-span-2 bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          <!-- Map Overlay HUD -->
          <div class="absolute top-6 left-6 z-10 flex items-center gap-3">
            <div class="px-3 py-1.5 rounded-full bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 beacon-pulse"></span>
              <span>Vector Campus Layer</span>
            </div>
            <div id="route-metric-pill" class="px-3 py-1.5 rounded-full bg-indigo-600/90 backdrop-blur-md border border-indigo-400/40 text-white text-xs font-bold">
              670m • ~8 min walk
            </div>
          </div>

          <!-- Interactive SVG Map -->
          <div class="w-full h-full flex items-center justify-center p-2">
            <svg id="campus-svg-canvas" viewBox="0 0 900 600" class="w-full h-full max-h-[520px] select-none">
              <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0F172A" />
                  <stop offset="100%" stop-color="#1E293B" />
                </linearGradient>
                <linearGradient id="greenLawn" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#064E3B" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#047857" stop-opacity="0.3" />
                </linearGradient>
              </defs>

              <!-- Map Background -->
              <rect width="900" height="600" fill="url(#bgGrad)" rx="24" />

              <!-- Campus Green Lawns / Landscape -->
              <path d="M 120 120 Q 320 80 500 130 T 800 240 L 760 520 Q 450 560 220 500 Z" fill="url(#greenLawn)" />

              <!-- Campus Walkway Grid (Dashed background paths) -->
              <path d="M 180 190 L 300 260 L 460 240 L 480 340 L 610 340 L 720 380" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />
              <path d="M 300 260 L 420 420 L 480 340" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />
              <path d="M 300 260 L 260 480 L 420 420" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none" />

              <!-- Active Animated Route Polyline Layer -->
              <path id="svg-animated-route-line"
                    d="M 180,190 L 300,260 L 460,240 L 480,340 L 610,340 L 720,380"
                    class="animated-route"
                    fill="none" />

              <!-- Campus Buildings (Nodes) -->
              <!-- 1. Block 34 (Engineering & CS) -->
              <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('b34')">
                <rect x="130" y="140" width="100" height="90" rx="14" fill="#1E1B4B" stroke="#6366F1" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                <text x="180" y="180" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Block 34</text>
                <text x="180" y="202" fill="#818CF8" font-size="11" text-anchor="middle">Eng & CS</text>
                <circle cx="180" cy="190" r="4" fill="#6366F1" />
              </g>

              <!-- 2. Main Library -->
              <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('lib')">
                <rect x="400" y="190" width="120" height="95" rx="14" fill="#1E1B4B" stroke="#4F46E5" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                <text x="460" y="235" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Main Library</text>
                <text x="460" y="255" fill="#818CF8" font-size="11" text-anchor="middle">Quiet Zones</text>
                <circle cx="460" cy="240" r="4" fill="#4F46E5" />
              </g>

              <!-- 3. Sports & Recreation Complex -->
              <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('sport')">
                <rect x="660" y="325" width="120" height="100" rx="14" fill="#1E1B4B" stroke="#EC4899" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                <text x="720" y="370" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Sports Complex</text>
                <text x="720" y="392" fill="#F472B6" font-size="11" text-anchor="middle">Pool & Gym</text>
                <circle cx="720" cy="380" r="4" fill="#EC4899" />
              </g>

              <!-- 4. Student Commons & Dining -->
              <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('sc')">
                <rect x="360" y="375" width="120" height="90" rx="14" fill="#1E1B4B" stroke="#10B981" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                <text x="420" y="415" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Commons</text>
                <text x="420" y="435" fill="#34D399" font-size="11" text-anchor="middle">Dining & Lounge</text>
                <circle cx="420" cy="420" r="4" fill="#10B981" />
              </g>

              <!-- 5. Innovation Hub -->
              <g class="cursor-pointer group" onclick="UniPulse.selectMapBuilding('inn')">
                <rect x="200" y="435" width="115" height="90" rx="14" fill="#1E1B4B" stroke="#F59E0B" stroke-width="2.5" class="transition-all group-hover:stroke-white group-hover:scale-105" />
                <text x="257" y="475" fill="#FFFFFF" font-weight="bold" font-size="14" text-anchor="middle">Innovation Hub</text>
                <text x="257" y="495" fill="#FCD34D" font-size="11" text-anchor="middle">Makers & Labs</text>
                <circle cx="260" cy="480" r="4" fill="#F59E0B" />
              </g>
            </svg>
          </div>

          <!-- Bottom Legend -->
          <div class="flex items-center justify-between text-[11px] text-slate-400 px-4 py-2 bg-slate-800/60 rounded-2xl border border-slate-700">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Academic & Tech</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Student Life</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Athletics</span>
            </div>
            <span>Click any building or node for details</span>
          </div>
        </div>

        <!-- Right Side: Building Directory & Step-by-Step Directions -->
        <div class="space-y-6">
          <!-- Active Building / Route Details Card -->
          <div id="map-directory-details" class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">Active Destination</span>
                <h3 class="text-lg font-bold text-slate-900 mt-1">Sports & Recreation Complex</h3>
              </div>
              <div class="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg">
                🏀
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed">
              Olympic swimming pool, indoor courts, climbing gym, and outdoor athletic track.
            </p>

            <div class="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Hours:</span>
                <span class="font-bold text-slate-800">6:00 AM - 10:00 PM</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-medium">Transit from B34:</span>
                <span class="font-bold text-indigo-600">~8 mins (670 meters)</span>
              </div>
            </div>

            <!-- Step-by-Step Directions -->
            <div class="space-y-2">
              <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Turn-by-Turn Path</h5>
              <div class="space-y-2 text-xs text-slate-600">
                <div class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                  <span>Exit Block 34 main concourse heading east toward Central Lawn</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                  <span>Pass Main Library courtyard fountain</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                  <span>Continue along shaded walkway into Sports Complex lobby</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
