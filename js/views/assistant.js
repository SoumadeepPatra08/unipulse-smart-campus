// =========================================================================
// UniPulse AI Assistant View: Streaming cards & Right Context Panel sync
// =========================================================================

export function renderAssistant() {
  return `
    <div class="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-fadeIn pb-4">
      <!-- Left / Center: Conversational Chat Interface -->
      <div class="flex-1 glass-card rounded-3xl shadow-card flex flex-col overflow-hidden">
        <!-- Chat Header -->
        <div class="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-white/20 dark:bg-slate-900/20 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
              🤖
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">UniPulse AI Campus Assistant</h3>
              <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <span class="w-2 h-2 rounded-full bg-emerald-500 beacon-pulse"></span>
                <span>Claude Campus Engine Online</span>
              </div>
            </div>
          </div>
          <button onclick="UniPulse.clearAssistantChat()" class="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-lg">
            Clear Chat
          </button>
        </div>

        <!-- Chat Stream Messages Container -->
        <div id="assistant-chat-stream" class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <!-- Initial Assistant Greeting -->
          <div class="flex items-start gap-3 max-w-2xl">
            <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div class="space-y-3">
              <div class="p-4 rounded-2xl rounded-tl-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed shadow-xs">
                Hello Alex! I am your UniPulse AI Campus Assistant. Ask me about quiet study desks, walking routes across buildings, lost belongings, or recommended hackathons.
              </div>

              <!-- Suggested starter prompts -->
              <div class="flex flex-wrap gap-2 text-xs">
                <button onclick="UniPulse.sendAssistantMessage('Where is the quietest study spot with power outlets right now?')"
                        class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                  📚 Quiet study desks right now
                </button>
                <button onclick="UniPulse.sendAssistantMessage('How do I walk from Block 34 to Sports Complex?')"
                        class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                  🗺️ Walking route: Block 34 to Sports
                </button>
                <button onclick="UniPulse.sendAssistantMessage('Check my lost Hydro Flask match status')"
                        class="px-3 py-1.5 rounded-xl glass-pill text-indigo-700 dark:text-indigo-300 font-medium transition-all">
                  🔍 Lost bottle match status
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input Bar -->
        <div class="p-4 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
          <form onsubmit="UniPulse.handleAssistantSubmit(event)" class="flex items-center gap-2">
            <input id="assistant-input" type="text"
                   placeholder="Ask anything about campus, study spaces, routes..."
                   class="flex-1 px-4 py-3 rounded-2xl glass-input text-sm">
            <button type="submit"
                    class="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5">
              <span>Send</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>
        </div>
      </div>

      <!-- Right: Dynamic Synchronized Context Panel -->
      <div id="right-context-panel" class="w-full lg:w-80 glass-card rounded-3xl shadow-card p-6 flex flex-col justify-between overflow-y-auto">
        <!-- Default Context View -->
        <div>
          <div class="flex items-center gap-2 pb-3 border-b border-white/20 dark:border-white/10 mb-4">
            <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Right Context Panel</h4>
          </div>

          <div id="context-panel-content" class="space-y-4">
            <div class="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 backdrop-blur-sm">
              <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Proactive Sync</span>
              <h5 class="text-sm font-bold text-slate-900 mt-1">Live Context Follows Chat</h5>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                When the assistant mentions study spaces, buildings, or lost items, interactive cards and quick actions appear here automatically.
              </p>
            </div>

            <!-- Featured Quick Action: Library Level 3 -->
            <div class="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-900">Main Library — Level 3</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Silent Focus</span>
              </div>
              <div class="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden my-2">
                <div class="bg-indigo-600 h-2 rounded-full" style="width: 78%"></div>
              </div>
              <div class="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                <span>78% Occupied</span>
                <span>26 Open Desks</span>
              </div>
              <button onclick="UniPulse.openReserveModal('space-1', 'Main Library — Level 3')"
                      class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors">
                Quick Reserve Desk
              </button>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-white/20 dark:border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Synced with UniPulse Session</span>
          <span class="font-mono text-indigo-600 font-semibold">ID: ${AppState.assistantSessionId.substring(0, 8)}</span>
        </div>
      </div>
    </div>
  `;
}
