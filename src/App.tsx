/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden flex flex-col relative">
      {/* Background Blurs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[150px]"></div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">E</div>
          <span className="text-xl font-bold tracking-tight text-white">[EAC]-Helper <span className="text-indigo-400 text-sm font-medium">v1.0.0</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="text-indigo-400 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> System Online</span>
          <span className="opacity-60">Documentation</span>
          <div className="px-4 py-2 bg-white/10 rounded-full border border-white/10">Connected: prod-firestore-db</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 p-8">
        {/* Aside Modules */}
        <aside className="col-span-3 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Modules</p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-white">
                Moderation
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors opacity-70">
                News Broadcaster
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors opacity-70">
                Leveling System
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors opacity-70">
                Global Settings
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h4 className="text-white font-semibold mb-2">Project Context</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Node.js 18.x (TypeScript)<br/>
                Discord.js v14.11<br/>
                Firebase Firestore SDK
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="col-span-6 flex flex-col gap-6">
          <div className="h-48 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-8 flex flex-col justify-end relative overflow-hidden">
            <h2 className="text-3xl font-bold text-white mb-2">Moderation Module</h2>
            <p className="text-indigo-100">Active protection for 4,281 guild members. Automated filters and manual command suite enabled.</p>
          </div>

          <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Configuration Settings</h3>
          </div>
        </div>

        {/* Aside Logs */}
        <aside className="col-span-3 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h4 className="text-sm font-bold text-white mb-4">Live Activity Logs</h4>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-10 border-t border-white/5 flex items-center justify-between px-8 text-[10px] text-slate-500 backdrop-blur-md">
        <div className="flex gap-4">
          <span>Discord.js API Gateway: Stable</span>
        </div>
        <div>© 2026 [EAC]-Helper Dev Lab • TypeScript Engineered</div>
      </footer>
    </div>
  );
}

