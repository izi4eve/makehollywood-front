import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import {
  fetchStockClips,
  createStockClip,
  updateStockClipDescription,
  deleteStockClip,
  type StockClip,
} from '../api/stock'
import { fetchSettings, putSetting } from '../api/settings'

// ── Constants ──────────────────────────────────────────────────────────────────

const FOLDER_KEY = 'stock_folder_path'
const DB_NAME = 'makehollywood'
const DB_STORE = 'fs_handles'
const HANDLE_KEY = 'stock_folder_handle'

// ── Browser support ────────────────────────────────────────────────────────────

function isFsApiSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// ── IndexedDB helpers for FileSystemDirectoryHandle ───────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

// ── Video helpers ──────────────────────────────────────────────────────────────

function formatDuration(sec: number | null): string {
  if (sec === null) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function resolutionLabel(w: number | null, h: number | null): string {
  if (!w || !h) return ''
  const long = Math.max(w, h)
  if (long >= 3840) return '4K'
  if (long >= 1920) return '2K'
  if (long >= 1280) return 'HD'
  return `${w}×${h}`
}

function readVideoMeta(file: File): Promise<{
  width: number; height: number; durationSec: number; orientation: 'vertical' | 'horizontal'
}> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSec: Math.round(video.duration),
        orientation: video.videoWidth >= video.videoHeight ? 'horizontal' : 'vertical',
      })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 0, height: 0, durationSec: 0, orientation: 'horizontal' })
    }
  })
}

function extractFrame(file: File, timeRatio = 0.15): Promise<string> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.onloadedmetadata = () => { video.currentTime = video.duration * timeRatio }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(512 / video.videoWidth, 512 / video.videoHeight, 1)
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve('') }
  })
}

async function generateDescriptionForFile(file: File, token: string): Promise<string> {
  const frame = await extractFrame(file)
  if (!frame) return ''
  const res = await fetch('/api/groq-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ frame }),
  })
  if (!res.ok) return ''
  const data = await res.json()
  return data.description ?? ''
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── ClipRow ────────────────────────────────────────────────────────────────────

interface ClipRowProps {
  clip: StockClip
  token: string
  dirHandle: FileSystemDirectoryHandle | null
  onUpdate: (updated: StockClip) => void
  onDelete: (id: number) => void
}

function ClipRow({ clip, token, dirHandle, onUpdate, onDelete }: ClipRowProps) {
  const [description, setDescription] = useState(clip.description ?? '')
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const debouncedDesc = useDebounce(description, 2000)

  // Sync description when clip prop updates (e.g. after AI processing)
  useEffect(() => {
    setDescription(clip.description ?? '')
    setSaveState('saved')
  }, [clip.description])

  // Auto-load video from folder handle
  useEffect(() => {
    if (!dirHandle) return
    dirHandle.getFileHandle(clip.filename)
      .then(fh => fh.getFile())
      .then(file => {
        setObjectUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(file)
        })
      })
      .catch(() => {}) // file not found in folder — silent
  }, [dirHandle, clip.filename])

  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }, [])

  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (debouncedDesc === (clip.description ?? '')) return
    setSaveState('saving')
    updateStockClipDescription(clip.id, debouncedDesc, token)
      .then(updated => { onUpdate(updated); setSaveState('saved') })
      .catch(() => setSaveState('unsaved'))
  }, [debouncedDesc])

  useEffect(() => {
    const handler = () => {
      if (description !== (clip.description ?? '')) {
        updateStockClipDescription(clip.id, description, token).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [description, clip.description, clip.id, token])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setIsPlaying(true) }
    else { v.pause(); setIsPlaying(false) }
  }

  return (
    <div className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl overflow-hidden flex transition">

      {/* Thumbnail */}
      <div
        className="relative flex-shrink-0 bg-stone-900 flex items-center justify-center cursor-pointer group"
        style={{ width: 180, minHeight: 120 }}
        onClick={objectUrl ? togglePlay : undefined}
      >
        {objectUrl ? (
          <video ref={videoRef} src={objectUrl}
            className="w-full h-full object-contain" style={{ maxHeight: 160 }}
            muted loop onEnded={() => setIsPlaying(false)} />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-stone-600 select-none py-6">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="text-[10px] text-stone-500">no preview</span>
          </div>
        )}

        {objectUrl && (
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}>
            <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
              {isPlaying
                ? <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              }
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {clip.indexed
            ? <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">indexed</span>
            : <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">not indexed</span>
          }
          {clip.orientation && (
            <span className="text-[9px] font-medium bg-black/50 text-white rounded px-1.5 py-0.5">
              {clip.orientation === 'vertical' ? '9:16' : '16:9'}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-none">
          {resolutionLabel(clip.width, clip.height) && (
            <span className="text-[9px] bg-black/50 text-stone-300 rounded px-1.5 py-0.5 font-mono">
              {resolutionLabel(clip.width, clip.height)}
            </span>
          )}
          {clip.durationSec !== null && (
            <span className="text-[9px] bg-black/50 text-white rounded px-1.5 py-0.5 font-mono">
              {formatDuration(clip.durationSec)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-2 min-w-0">
        <p className="text-[11px] font-mono text-stone-400 truncate">{clip.filename}</p>
        <div className="relative flex-1">
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setSaveState('unsaved') }}
            placeholder="Describe what's in the frame, the mood, and metaphorical associations…"
            rows={3}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:bg-white transition resize-none placeholder-stone-300 leading-relaxed"
          />
          <span className={`absolute bottom-2.5 right-3 text-[10px] pointer-events-none ${
            saveState === 'saved' ? 'text-stone-300' :
            saveState === 'saving' ? 'text-teal-400' : 'text-amber-400'
          }`}>
            {saveState === 'saved' ? 'saved' : saveState === 'saving' ? 'saving…' : 'unsaved'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => onDelete(clip.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs">
            🗑
          </button>
          <span className={`text-[11px] ${clip.indexed ? 'text-emerald-500' : 'text-amber-500'}`}>
            {clip.indexed ? '✓ indexed & ready' : '⚠ needs description'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function StockPage() {
  const { token } = useAuth()
  const [clips, setClips] = useState<StockClip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Folder state
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderLoading, setFolderLoading] = useState(true)

  // AI batch processing
  const [processing, setProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState<string | null>(null)

  const fsSupported = isFsApiSupported()

  // Load settings + clips + restore handle from IndexedDB
  useEffect(() => {
    if (!token) return
    Promise.all([
      fetchSettings(token),
      fetchStockClips(token),
      loadHandle(),
    ]).then(async ([settings, fetchedClips, handle]) => {
      setFolderPath(settings[FOLDER_KEY] ?? null)
      setClips(fetchedClips)

      if (handle) {
        // requestPermission exists in Chrome/Edge but is not in standard TS types
        const h = handle as FileSystemDirectoryHandle & {
          requestPermission?: (opts: { mode: string }) => Promise<string>
        }
        if (h.requestPermission) {
          const perm = await h.requestPermission({ mode: 'read' })
          if (perm === 'granted') setDirHandle(handle)
        } else {
          // Firefox / browsers without requestPermission — set handle directly,
          // actual permission will be requested on first file access
          setDirHandle(handle)
        }
      }
    }).catch(() => setError('Failed to load.'))
      .finally(() => { setLoading(false); setFolderLoading(false) })
  }, [token])

  // Pick folder via File System Access API
  const handlePickFolder = async () => {
    if (!fsSupported) return
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'read' })
      await saveHandle(handle)
      setDirHandle(handle)

      const path = handle.name
      setFolderPath(path)
      if (token) await putSetting(FOLDER_KEY, path, token)

      await scanAndRegister(handle)
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('Could not access folder.')
    }
  }

  const handleRelinkFolder = handlePickFolder

  // Scan directory, register new clips on backend
  const scanAndRegister = async (handle: FileSystemDirectoryHandle) => {
    if (!token) return
    const videoExts = ['.mp4', '.mov', '.webm']
    const existingFilenames = new Set(clips.map(c => c.filename))
    const newClips: StockClip[] = []

    for await (const [name, entry] of (handle as any).entries()) {
      if (entry.kind !== 'file') continue
      if (!videoExts.some(ext => name.toLowerCase().endsWith(ext))) continue
      if (existingFilenames.has(name)) continue

      const file = await (entry as FileSystemFileHandle).getFile()
      const meta = await readVideoMeta(file)
      try {
        const created = await createStockClip({ filename: name, localPath: name, ...meta }, token)
        newClips.push(created)
      } catch {}
    }

    if (newClips.length > 0) {
      setClips(prev => [...newClips, ...prev])
    }
  }

  // Batch AI processing — generate descriptions for all unindexed clips
  const handleProcessAll = async () => {
    if (!dirHandle || !token) return
    const unindexed = clips.filter(c => !c.indexed)
    if (!unindexed.length) return

    setProcessing(true)
    let done = 0

    for (const clip of unindexed) {
      setProcessProgress(`Processing ${++done} / ${unindexed.length}: ${clip.filename}`)
      try {
        const fileHandle = await dirHandle.getFileHandle(clip.filename)
        const file = await fileHandle.getFile()
        const desc = await generateDescriptionForFile(file, token)
        if (desc) {
          const updated = await updateStockClipDescription(clip.id, desc, token)
          setClips(prev => prev.map(c => c.id === updated.id ? updated : c))
        }
      } catch {
        // file not found in folder — skip
      }
    }

    setProcessing(false)
    setProcessProgress(null)
  }

  const handleUpdate = useCallback((updated: StockClip) => {
    setClips(prev => prev.map(c => c.id === updated.id ? updated : c))
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    if (!token) return
    await deleteStockClip(id, token)
    setClips(prev => prev.filter(c => c.id !== id))
  }, [token])

  const filtered = clips.filter(c => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return c.filename.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)
  })

  const indexedCount = clips.filter(c => c.indexed).length
  const needDescCount = clips.filter(c => !c.indexed).length

  // const folderReady = !!folderPath
  const folderReady = !!folderPath && clips.length > 0

  return (
    <Layout breadcrumbs={[{ label: 'Stock' }]}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Stock</h1>

        {/* ── Info block ──────────────────────────────────────────────────── */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 leading-relaxed">
          <p className="mb-2">
            If you want to use your own stock videos in the{' '}
            <Link to="/video" className="underline font-medium hover:text-amber-900">Video</Link>{' '}
            section, point the app to the folder on your computer where your clips are stored.
            Your files never leave your computer — only filenames and AI-generated text descriptions are saved.
          </p>
          <p className="mb-2">
            <strong>Selecting a folder requires Chrome or Edge</strong> (one time only).
            Video previews and AI processing also only work in Chrome or Edge — Firefox cannot
            access local files from a saved folder handle.
          </p>
          <p className="text-amber-700">
            <strong>⚠ Important:</strong> All video files must be placed <strong>directly inside</strong> the selected
            folder — subfolders are not scanned. Supported formats: MP4, MOV, WEBM.
          </p>
        </div>

        {/* ── Folder selector ─────────────────────────────────────────────── */}
        {!folderLoading && (
          folderReady ? (
            <div className="mb-4">
              <div className="flex items-stretch rounded-lg overflow-hidden border border-stone-200 mb-3">
                <div className="flex-1 text-[12px] px-3 py-2 bg-stone-50 font-mono text-stone-500 truncate text-right">
                  {folderPath}
                </div>
                <button
                  onClick={handleRelinkFolder}
                  disabled={!fsSupported}
                  className="text-[12px] font-medium px-3 border-l border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-500 transition disabled:opacity-40"
                  title={!fsSupported ? 'Requires Chrome or Edge' : undefined}
                >
                  Change folder
                </button>
              </div>

              {/* AI Process button */}
              {needDescCount > 0 && (
                <button
                  onClick={handleProcessAll}
                  disabled={processing || !dirHandle}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  title={!dirHandle ? 'Open this page in Chrome or Edge to enable AI processing' : undefined}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {processProgress ?? 'Processing…'}
                    </>
                  ) : (
                    <>✦ AI process all clips ({needDescCount} without description)</>
                  )}
                </button>
              )}

              {needDescCount === 0 && clips.length > 0 && (
                <div className="text-center text-sm text-emerald-600 py-2">
                  ✓ All {clips.length} clips are indexed and ready
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handlePickFolder}
              disabled={!fsSupported}
              className="w-full mb-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition text-sm"
            >
              {fsSupported
                ? '📁 Select your stock clips folder (one time, Chrome / Edge only)'
                : '📁 Selecting a folder requires Chrome or Edge'}
            </button>
          )
        )}

        {/* ── Search + stats ───────────────────────────────────────────────── */}
        {folderReady && clips.length > 0 && (
          <>
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input type="text" placeholder="Search by filename or description…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition"
              />
            </div>
            <p className="text-sm text-stone-400 mb-4">
              <span className="text-stone-600 font-medium">{clips.length}</span> clips
              {' · '}
              <span className="text-emerald-600 font-medium">{indexedCount}</span> indexed
              {needDescCount > 0 && (
                <> · <span className="text-amber-500 font-medium">{needDescCount}</span> need description</>
              )}
            </p>
          </>
        )}

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        {/* ── Clip list ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 text-stone-300 text-sm">Loading…</div>
        ) : folderReady && filtered.length === 0 && search ? (
          <div className="text-center py-16 text-stone-400 text-sm">No clips match "{search}"</div>
        ) : folderReady && filtered.length === 0 ? (
          <div className="text-center py-16 text-sm">
            <p className="text-orange-500 font-semibold mb-1">No clips found in this folder.</p>
            <p className="text-stone-500">
              Make sure your MP4, MOV or WEBM files are placed <strong>directly</strong> in the selected folder
              — subfolders are not scanned.
            </p>
            <button
              onClick={handlePickFolder}
              disabled={!fsSupported}
              className="mt-4 text-teal-600 hover:text-teal-500 text-sm underline disabled:opacity-40"
            >
              Select a different folder
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(clip => (
              <ClipRow key={clip.id} clip={clip} token={token!}
                dirHandle={dirHandle}
                onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
