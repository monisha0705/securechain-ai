/**
 * components/UploadZone.jsx
 * Drag-and-drop file upload for requirements.txt
 */

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import clsx from 'clsx'

export default function UploadZone({ onScanComplete, isScanning, setIsScanning }) {
  const [file, setFile] = useState(null)
  const [uploadState, setUploadState] = useState('idle') // idle | uploading | uploaded | scanning | error
  const [error, setError] = useState(null)
  const [scanId, setScanId] = useState(null)
  const [progress, setProgress] = useState(0)

  const reset = () => {
    setFile(null)
    setUploadState('idle')
    setError(null)
    setScanId(null)
    setProgress(0)
  }

  const onDrop = useCallback(async (accepted, rejected) => {
    if (rejected.length > 0) {
      setError('Please upload a .txt file (requirements.txt format).')
      return
    }
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setError(null)
    setUploadState('uploading')

    try {
      // Upload
      const form = new FormData()
      form.append('file', f)

      const uploadRes = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        body: form,
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.detail || 'Upload failed')
      }
      const uploadData = await uploadRes.json()
      setScanId(uploadData.scan_id)
      setUploadState('uploaded')
      setProgress(30)

      // Auto-scan
      setUploadState('scanning')
      setIsScanning(true)
      setProgress(55)

      const scanRes = await fetch(`http://localhost:8000/api/v1/scan/${uploadData.scan_id}`, {
        method: 'POST',
      })
      if (!scanRes.ok) {
        const err = await scanRes.json()
        throw new Error(err.detail || 'Scan failed')
      }
      const scanData = await scanRes.json()
      setProgress(100)
      setUploadState('done')
      setIsScanning(false)
      onScanComplete(scanData)
    } catch (err) {
      setError(err.message)
      setUploadState('error')
      setIsScanning(false)
      setProgress(0)
    }
  }, [onScanComplete, setIsScanning])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: isScanning,
  })

  const stateConfig = {
    idle: {
      icon: <Upload size={32} className="text-ink-500 group-hover:text-cyan-DEFAULT transition-colors" />,
      title: 'Drop requirements.txt here',
      sub: 'or click to browse — .txt files only',
      border: isDragActive ? 'border-cyan-DEFAULT' : 'border-ink-600 hover:border-cyan-DEFAULT/50',
      bg: isDragActive ? 'bg-cyan-glow' : 'bg-transparent',
    },
    uploading: {
      icon: <Loader2 size={32} className="text-cyan-DEFAULT animate-spin" />,
      title: 'Uploading file…',
      sub: 'Parsing dependency tree',
      border: 'border-cyan-DEFAULT/50',
      bg: 'bg-cyan-glow',
    },
    scanning: {
      icon: <Loader2 size={32} className="text-cyan-DEFAULT animate-spin" />,
      title: 'Running full scan…',
      sub: 'Checking OSV database · Running Isolation Forest',
      border: 'border-cyan-DEFAULT/50',
      bg: 'bg-cyan-glow',
    },
    uploaded: {
      icon: <CheckCircle size={32} className="text-green-safe" />,
      title: 'File ready',
      sub: 'Starting scan…',
      border: 'border-green-safe/50',
      bg: 'bg-green-glow',
    },
    done: {
      icon: <CheckCircle size={32} className="text-green-safe" />,
      title: 'Scan complete!',
      sub: 'Results loaded below',
      border: 'border-green-safe/50',
      bg: 'bg-green-glow',
    },
    error: {
      icon: <AlertCircle size={32} className="text-red-alert" />,
      title: 'Scan failed',
      sub: error || 'Unknown error occurred',
      border: 'border-red-alert/50',
      bg: 'bg-red-glow',
    },
  }

  const cfg = stateConfig[uploadState]
  const isActive = ['uploading', 'scanning'].includes(uploadState)

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'group relative rounded-xl border-2 border-dashed transition-all duration-300',
          'cursor-pointer flex flex-col items-center justify-center gap-4 py-12 px-8',
          cfg.border,
          cfg.bg,
          isActive && 'scan-beam',
          isScanning && 'pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3 text-center">
          {cfg.icon}
          <div>
            <p className="font-display font-semibold text-base text-ink-100">{cfg.title}</p>
            <p className="font-body text-sm text-ink-400 mt-1">{cfg.sub}</p>
          </div>
        </div>

        {/* Filename tag */}
        {file && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800/80
                          border border-ink-700 text-sm font-mono text-ink-200">
            <FileText size={13} className="text-cyan-DEFAULT" />
            {file.name}
            <span className="text-ink-500 text-xs">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress > 0 && progress < 100 && (
        <div className="h-1 rounded-full bg-ink-700 overflow-hidden">
          <div
            className="h-full bg-cyan-DEFAULT rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error + reset */}
      {uploadState === 'error' && (
        <button onClick={reset}
          className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink-200 transition-colors">
          <X size={14} /> Try again
        </button>
      )}

      {/* Reset after done */}
      {uploadState === 'done' && (
        <button onClick={reset}
          className="text-sm text-ink-400 hover:text-cyan-DEFAULT transition-colors font-mono">
          ↩ Scan another file
        </button>
      )}

      {/* Sample hint */}
      {uploadState === 'idle' && (
        <p className="text-center text-xs text-ink-500 font-mono">
          Try the included <code className="text-cyan-DEFAULT/70">sample_requirements.txt</code> in the repo
        </p>
      )}
    </div>
  )
}
