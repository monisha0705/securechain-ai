/**
 * App.jsx - SecureChain AI root component
 */

import { useState, useEffect } from 'react'
import Header from './components/Header'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import History from "./pages/History";

export default function App() {
  const [scanData, setScanData] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isBackendOnline, setIsBackendOnline] = useState(false)

  // 🔥 NEW: page control
  const [currentPage, setCurrentPage] = useState("home")

  // Check backend health on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(r => r.ok && setIsBackendOnline(true))
      .catch(() => setIsBackendOnline(false))
  }, [])

  const handleScanComplete = (data) => {
    setScanData(data)
    setCurrentPage("dashboard")   // move to dashboard after scan
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-ink-DEFAULT bg-grid-subtle bg-grid">

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none
                      bg-cyan-500/3 blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none
                      bg-violet-500/3 blur-3xl" />

      <Header isBackendOnline={isBackendOnline} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">

        {/* 🔥 NAV BUTTON */}
        <div className="flex justify-end mb-4 gap-3">
          <button
            onClick={() => {
              setCurrentPage("home")
              setScanData(null)
            }}
            className="btn-outline"
          >
            Home
          </button>

          <button
            onClick={() => setCurrentPage("history")}
            className="btn-outline"
          >
            History
          </button>
        </div>

        {/* 🔥 PAGE SWITCHING */}
        {currentPage === "history" ? (
          <History />
        ) : currentPage === "dashboard" && scanData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setScanData(null)
                  setCurrentPage("home")
                }}
                className="btn-outline text-sm flex items-center gap-2"
              >
                ← New Scan
              </button>
              <p className="text-xs text-ink-500 font-mono hidden sm:block">
                SecureChain AI · Supply Chain Attack Detection System
              </p>
            </div>
            <Dashboard data={scanData} />
          </div>
        ) : (
          <Landing
            onScanComplete={handleScanComplete}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800 mt-16 py-6 text-center">
        <p className="font-mono text-xs text-ink-600">
          SecureChain AI · Research-grade supply chain security ·
          <span className="text-ink-700"> Built with FastAPI + React + Isolation Forest</span>
        </p>
      </footer>
    </div>
  )
}