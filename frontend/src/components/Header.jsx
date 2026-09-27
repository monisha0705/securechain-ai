/**
 * components/Header.jsx
 * Top navigation bar with branding and status indicator.
 */

import { Shield, Activity, Github } from 'lucide-react'

export default function Header({ isBackendOnline }) {
  return (
    <header className="border-b border-ink-700/60 bg-ink-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/30
                            flex items-center justify-center glow-cyan">
              <Shield size={18} className="text-cyan-DEFAULT" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-DEFAULT
                             animate-pulse-slow" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-ink-50 leading-none tracking-tight">
              SecureChain <span className="text-cyan-DEFAULT">AI</span>
            </h1>
            <p className="font-mono text-[10px] text-ink-400 tracking-widest uppercase mt-0.5">
              Supply Chain Defense
            </p>
          </div>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Scanner', 'History', 'Docs'].map(item => (
            <button
              key={item}
              className="px-4 py-1.5 rounded-md font-body text-sm text-ink-300
                         hover:text-ink-50 hover:bg-ink-700/40 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-ink-800 border border-ink-700/60 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isBackendOnline ? 'bg-green-safe animate-pulse' : 'bg-red-alert'
            }`} />
            <span className="text-ink-300">
              {isBackendOnline ? 'API Online' : 'API Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-ink-400" />
            <span className="font-mono text-xs text-ink-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </header>
  )
}
