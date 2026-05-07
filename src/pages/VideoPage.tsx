import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fetchScripts, type ScriptResponse } from '../api/scripts'
import { fetchLongforms, type LongformResponse } from '../api/longforms'
import { fetchStockClips, type StockClip } from '../api/stock'

// ── Constants ──────────────────────────────────────────────────────────────────

const CLIPS_BATCH = 3          // clips shown per source initially
const CLIPS_MAX   = 21         // hard cap per source per segment (free-tier limit)
const MODAL_PAGE_SIZE = 8

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Segment {
  id: string
  text: string
  startSec: number
  endSec: number
  myClips: MyClipOption[]
  stockClips: StockClipOption[]
  myClipsShown: number
  stockClipsShown: number
  selectedClipId: string | null   // `my-{stockClip.id}` | `stock-{pexelsId}`
  pexelsDownloaded: Record<string, boolean>
}

interface MyClipOption {
  id: string
  filename: string
  objectUrl: string | null
}

interface StockClipOption {
  id: string
  filename: string
  thumbnailUrl: string | null
  downloadUrl: string
}

type SourceTab = 'scripts' | 'longform'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function segmentId(index: number): string {
  return `seg-${index}`
}

// ── StepRow ────────────────────────────────────────────────────────────────────

interface StepRowProps {
  number: number
  done?: boolean
  active: boolean
  label: string
  last?: boolean
  children: React.ReactNode
}

function StepRow({ number, done, active, label, last, children }: StepRowProps) {
  return (
    <div className="flex gap-4 mb-3">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition ${
          done
            ? 'bg-emerald-100 text-emerald-700 text-sm'
            : active
              ? 'bg-teal-600 text-white'
              : 'bg-stone-200 text-stone-400'
        }`}>
          {done ? '✓' : number}
        </div>
        {!last && (
          <div className={`w-px flex-1 mt-1 transition ${active || done ? 'bg-teal-200' : 'bg-stone-200'}`}
            style={{ minHeight: 14 }} />
        )}
      </div>
      <div className="flex-1 pb-3">
        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 mt-1 transition ${
          active || done ? 'text-stone-500' : 'text-stone-300'
        }`}>{label}</p>
        <div className={active || done ? '' : 'opacity-40 pointer-events-none'}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── ClipThumb ──────────────────────────────────────────────────────────────────

interface ClipThumbProps {
  id: string
  label: string
  isPersonal?: boolean
  objectUrl?: string | null
  thumbnailUrl?: string | null
  selected: boolean
  onSelect: (id: string) => void
}

function ClipThumb({ id, label, isPersonal, objectUrl, thumbnailUrl, selected, onSelect }: ClipThumbProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const borderCls = selected
    ? 'border-teal-500 bg-teal-50'
    : isPersonal
      ? 'border-orange-400 bg-orange-50/50'
      : 'border-stone-200 bg-stone-100'

  return (
    <button
      onClick={() => onSelect(id)}
      className={`relative flex-shrink-0 rounded-lg border overflow-hidden transition-all duration-150 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${borderCls}`}
      style={{ width: 88, height: 56 }}
      title={label}
    >
      {objectUrl ? (
        <video
          ref={videoRef}
          src={objectUrl}
          className="w-full h-full object-cover"
          muted
          playsInline
          onMouseEnter={() => videoRef.current?.play()}
          onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 } }}
        />
      ) : thumbnailUrl ? (
        <img src={thumbnailUrl} alt={label} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[9px] text-stone-400 leading-tight px-1 text-center">{label}</span>
      )}

      {isPersonal && (
        <span className="absolute top-1 left-1 bg-orange-500 text-white text-[8px] font-bold px-1 rounded-[3px] leading-tight">★</span>
      )}
      {selected && (
        <span className="absolute top-1 right-1 bg-teal-600 text-white text-[8px] font-bold px-1 rounded-[3px] leading-tight">✓</span>
      )}
    </button>
  )
}

// ── SegmentBlock ───────────────────────────────────────────────────────────────

interface SegmentBlockProps {
  seg: Segment
  index: number
  onSelectClip: (segId: string, clipId: string) => void
  onLoadMoreMy: (segId: string) => void
  onLoadMoreStock: (segId: string) => void
  onDownloadPexels: (segId: string, clipId: string, url: string, filename: string) => void
}

function SegmentBlock({ seg, index, onSelectClip, onLoadMoreMy, onLoadMoreStock, onDownloadPexels }: SegmentBlockProps) {
  const isDone = seg.selectedClipId !== null
  const selectedIsStock = isDone && seg.selectedClipId!.startsWith('stock-')
  const selectedStockClip = selectedIsStock
    ? seg.stockClips.find(c => `stock-${c.id}` === seg.selectedClipId)
    : null

  const visibleMyClips = seg.myClips.slice(0, seg.myClipsShown)
  const visibleStockClips = seg.stockClips.slice(0, seg.stockClipsShown)

  const canLoadMoreMy    = seg.myClipsShown < Math.min(seg.myClips.length, CLIPS_MAX)
  const canLoadMoreStock = seg.stockClipsShown < Math.min(seg.stockClips.length, CLIPS_MAX)

  return (
    <div className={`bg-white rounded-xl mb-2 p-3.5 transition-all duration-200 ${
      isDone ? 'border-2 border-teal-500' : 'border border-stone-200'
    }`}>
      {/* Phrase + timestamp */}
      <p className="text-[15px] font-semibold text-stone-900 leading-snug mb-1">
        {index + 1}. {seg.text}
      </p>
      <p className="text-[10px] text-stone-400 font-mono mb-3">
        {fmtTime(seg.startSec)} – {fmtTime(seg.endSec)}
      </p>

      {/* My clips */}
      {seg.myClips.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
            <span className="text-orange-500">★</span> My clips
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {visibleMyClips.map(clip => (
              <ClipThumb
                key={clip.id}
                id={`my-${clip.id}`}
                label={clip.filename}
                isPersonal
                objectUrl={clip.objectUrl}
                selected={seg.selectedClipId === `my-${clip.id}`}
                onSelect={(cid) => onSelectClip(seg.id, cid)}
              />
            ))}
            {canLoadMoreMy && (
              <button
                onClick={() => onLoadMoreMy(seg.id)}
                className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-md px-2.5 py-1 hover:bg-teal-100 transition h-10 flex-shrink-0"
              >
                +{Math.min(CLIPS_BATCH, seg.myClips.length - seg.myClipsShown)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {seg.myClips.length > 0 && seg.stockClips.length > 0 && (
        <div className="border-t border-stone-100 my-2" />
      )}

      {/* Stock clips */}
      {seg.stockClips.length > 0 && (
        <div className="mb-1">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
            Stock <span className="text-[9px] text-stone-300 font-normal normal-case tracking-normal">via Pexels</span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {visibleStockClips.map(clip => (
              <ClipThumb
                key={clip.id}
                id={`stock-${clip.id}`}
                label={clip.filename}
                thumbnailUrl={clip.thumbnailUrl}
                selected={seg.selectedClipId === `stock-${clip.id}`}
                onSelect={(cid) => onSelectClip(seg.id, cid)}
              />
            ))}
            {canLoadMoreStock && (
              <button
                onClick={() => onLoadMoreStock(seg.id)}
                className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-md px-2.5 py-1 hover:bg-teal-100 transition h-10 flex-shrink-0"
              >
                +{Math.min(CLIPS_BATCH, seg.stockClips.length - seg.stockClipsShown)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pexels download row */}
      {selectedStockClip && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-stone-100">
          <span className={`text-[11px] font-medium truncate flex-1 ${
            seg.pexelsDownloaded[selectedStockClip.id] ? 'text-stone-400' : 'text-orange-500'
          }`}>
            {selectedStockClip.filename}
          </span>
          <button
            onClick={() => onDownloadPexels(seg.id, selectedStockClip.id, selectedStockClip.downloadUrl, selectedStockClip.filename)}
            className={`text-[10px] font-semibold rounded-md px-2.5 py-1 border transition flex-shrink-0 ${
              seg.pexelsDownloaded[selectedStockClip.id]
                ? 'text-stone-400 border-stone-200 cursor-default'
                : 'text-orange-500 border-orange-400 hover:bg-orange-50'
            }`}
            disabled={seg.pexelsDownloaded[selectedStockClip.id]}
          >
            {seg.pexelsDownloaded[selectedStockClip.id] ? 'Downloaded' : '↓ Download'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── PickerModal ────────────────────────────────────────────────────────────────

interface PickerModalProps {
  scripts: ScriptResponse[]
  longforms: LongformResponse[]
  loading: boolean
  onSelect: (text: string) => void
  onClose: () => void
}

function PickerModal({ scripts, longforms, loading, onSelect, onClose }: PickerModalProps) {
  const [tab, setTab] = useState<SourceTab>('scripts')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const list = tab === 'scripts' ? scripts : longforms
  const filtered = list.filter(item => {
    const q = search.toLowerCase()
    if (!q) return true
    const title = 'name' in item ? (item.name ?? '') : (item.title ?? '')
    return title.toLowerCase().includes(q) || item.fullText.toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filtered.length / MODAL_PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * MODAL_PAGE_SIZE, page * MODAL_PAGE_SIZE)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl flex flex-col"
        style={{ width: '90vw', maxWidth: 680, height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100 shrink-0">
          <h3 className="text-base font-semibold text-stone-900">Pick a script to voice</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>
        <div className="flex items-center gap-1 px-5 pt-3 pb-1 shrink-0">
          {(['scripts', 'longform'] as SourceTab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1) }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition capitalize ${
                tab === t ? 'bg-teal-600 text-white' : 'text-stone-400 hover:text-stone-600 border border-stone-200'
              }`}
            >
              {t === 'scripts' ? 'Scripts' : 'Longform'}
            </button>
          ))}
        </div>
        <div className="px-5 pt-2 pb-1 shrink-0">
          <input
            type="text"
            placeholder={`Search ${tab}…`}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-300"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <p className="text-sm text-stone-400 text-center py-10">Loading…</p>
          ) : paginated.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-10">
              {search ? `No results for "${search}"` : `No ${tab} yet`}
            </p>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              {paginated.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.fullText)}
                  className="text-left border rounded-xl px-4 py-3 bg-stone-50 hover:bg-teal-50 border-stone-200 hover:border-teal-300 transition"
                >
                  {(item.name || item.title) && (
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                      {item.name ?? item.title}
                    </p>
                  )}
                  <p className="text-sm text-stone-800 leading-relaxed line-clamp-2">{item.fullText}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-stone-100 shrink-0">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-30 hover:text-stone-600 transition"
            >← Prev</button>
            <span className="text-xs text-stone-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-lg disabled:opacity-30 hover:text-stone-600 transition"
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ConfirmModal ───────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-stone-900 mb-2">Start a new project?</h3>
        <p className="text-sm text-stone-500 mb-5 leading-relaxed">
          All current progress — script, voiceover and selected clips — will be cleared.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-stone-500 border border-stone-200 px-4 py-2 rounded-lg hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-lg transition"
          >
            Yes, start fresh
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function VideoPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Step state
  const [text, setText] = useState('')
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceFileName, setVoiceFileName] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical')
  const [resolution, setResolution] = useState<'2k' | '4k'>('2k')
  const [segments, setSegments] = useState<Segment[]>([])
  const [analysing, setAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Modals
  const [showPicker, setShowPicker] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Script picker data
  const [scripts, setScripts] = useState<ScriptResponse[]>([])
  const [longforms, setLongforms] = useState<LongformResponse[]>([])
  const [listsLoading, setListsLoading] = useState(false)

  // Personal stock (Chrome/Edge only)
  const [myStockClips, setMyStockClips] = useState<(StockClip & { objectUrl?: string })[]>([])

  // File input ref
  const voiceInputRef = useRef<HTMLInputElement>(null)

  // ── Load personal stock clips + object URLs from IndexedDB handle ──────────

  useEffect(() => {
    if (!token) return
    fetchStockClips(token)
      .then(clips => setMyStockClips(clips.filter(c => c.indexed)))
      .catch(() => {})
  }, [token])

  // ── Load scripts/longforms when picker opens ───────────────────────────────

  useEffect(() => {
    if (!showPicker || !token) return
    if (scripts.length || longforms.length) return
    setListsLoading(true)
    Promise.all([
      import('../api/scripts').then(m => m.fetchScripts(token)),
      import('../api/longforms').then(m => m.fetchLongforms(token)),
    ])
      .then(([s, lf]) => { setScripts(s); setLongforms(lf) })
      .catch(() => {})
      .finally(() => setListsLoading(false))
  }, [showPicker, token])

  // ── Derived ────────────────────────────────────────────────────────────────

  const step2Active = text.trim().length > 0
  const step3Active = step2Active && voiceFile !== null
  const step4Active = step3Active
  const hasSegments = segments.length > 0
  const chosenCount = segments.filter(s => s.selectedClipId !== null).length
  const allChosen   = hasSegments && chosenCount === segments.length

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleVoiceFile = (file: File) => {
    setVoiceFile(file)
    setVoiceFileName(file.name)
  }

  const handleVoiceDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) handleVoiceFile(file)
  }

  const handleNewVideo = () => {
    if (text || voiceFile || segments.length) setShowConfirm(true)
    else resetAll()
  }

  const resetAll = () => {
    setText('')
    setVoiceFile(null)
    setVoiceFileName(null)
    setSegments([])
    setAnalysisError(null)
    setExportError(null)
  }

  const handleSelectClip = useCallback((segId: string, clipId: string) => {
    setSegments(prev => prev.map(s =>
      s.id === segId
        ? { ...s, selectedClipId: s.selectedClipId === clipId ? null : clipId }
        : s
    ))
  }, [])

  const handleLoadMoreMy = useCallback((segId: string) => {
    setSegments(prev => prev.map(s =>
      s.id === segId
        ? { ...s, myClipsShown: Math.min(s.myClipsShown + CLIPS_BATCH, CLIPS_MAX, s.myClips.length) }
        : s
    ))
  }, [])

  const handleLoadMoreStock = useCallback((segId: string) => {
    setSegments(prev => prev.map(s =>
      s.id === segId
        ? { ...s, stockClipsShown: Math.min(s.stockClipsShown + CLIPS_BATCH, CLIPS_MAX, s.stockClips.length) }
        : s
    ))
  }, [])

  const handleDownloadPexels = useCallback((segId: string, clipId: string, url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.click()
    setSegments(prev => prev.map(s =>
      s.id === segId
        ? { ...s, pexelsDownloaded: { ...s.pexelsDownloaded, [clipId]: true } }
        : s
    ))
  }, [])

  // ── Analyse ────────────────────────────────────────────────────────────────

  const handleAnalyse = async () => {
    if (!voiceFile || !text.trim() || !token) return
    setAnalysing(true)
    setAnalysisError(null)
    setSegments([])

    try {
      const formData = new FormData()
      formData.append('audio', voiceFile)
      formData.append('text', text.trim())
      formData.append('orientation', orientation)
      formData.append('resolution', resolution)

      const res = await fetch('/api/video/analyse', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'analysis_failed')
      }

      const data = await res.json() as {
        segments: Array<{
          text: string
          startSec: number
          endSec: number
          myClipIds: number[]
          pexelsClips: Array<{
            id: string
            filename: string
            thumbnailUrl: string
            downloadUrl: string
          }>
        }>
      }

      // Map personal stock clips by ID
      const myClipsById = new Map(myStockClips.map(c => [c.id, c]))

      const built: Segment[] = data.segments.map((raw, i) => ({
        id: segmentId(i),
        text: raw.text,
        startSec: raw.startSec,
        endSec: raw.endSec,
        myClips: raw.myClipIds
          .map(id => myClipsById.get(id))
          .filter(Boolean)
          .map(c => ({
            id: String(c!.id),
            filename: c!.filename,
            objectUrl: null, // populated from dirHandle in StockPage; here we have no direct file access
          })),
        stockClips: raw.pexelsClips.map(p => ({
          id: p.id,
          filename: p.filename,
          thumbnailUrl: p.thumbnailUrl,
          downloadUrl: p.downloadUrl,
        })),
        myClipsShown: CLIPS_BATCH,
        stockClipsShown: CLIPS_BATCH,
        selectedClipId: null,
        pexelsDownloaded: {},
      }))

      setSegments(built)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'rate_limit') setAnalysisError('Too many requests. Please wait a moment.')
      else if (msg === 'timeout')   setAnalysisError('Analysis timed out. Please try again.')
      else setAnalysisError('Something went wrong. Please try again.')
    } finally {
      setAnalysing(false)
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!allChosen || !token) return
    setExporting(true)
    setExportError(null)

    try {
      const payload = {
        orientation,
        resolution,
        segments: segments.map(s => ({
          text: s.text,
          startSec: s.startSec,
          endSec: s.endSec,
          selectedClipId: s.selectedClipId,
        })),
      }

      const res = await fetch('/api/video/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('export_failed')

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `project-${Date.now()}.fcpxml`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout breadcrumbs={[{ label: 'Video' }]}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Video</h1>
            <p className="text-stone-400 text-sm leading-relaxed">
              Load your script and voiceover, AI splits everything into ideas and suggests clips —
              then export a ready draft to Final Cut, DaVinci, or Premiere.
            </p>
          </div>
          <button
            onClick={handleNewVideo}
            className="ml-4 shrink-0 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New video
          </button>
        </div>

        {/* Chrome note */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
          Video previews and personal stock selection require <strong>Chrome or Edge</strong>.
          In other browsers your local clips will not be available.
        </div>

        {/* Step 1 — Script */}
        <StepRow number={1} done={step2Active} active label="Script">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-stone-700">What should be voiced?</p>
              <button
                onClick={() => setShowPicker(true)}
                className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition"
              >
                Pick from Scripts or Longform →
              </button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Or paste your script here…"
              rows={5}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
            />
          </div>
        </StepRow>

        {/* Step 2 — Voiceover */}
        <StepRow number={2} done={step3Active} active={step2Active} label="Voiceover">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <input
              ref={voiceInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleVoiceFile(f) }}
            />
            <div
              className="border-2 border-dashed border-stone-200 hover:border-teal-400 rounded-xl p-4 text-center cursor-pointer transition"
              onClick={() => voiceInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleVoiceDrop}
            >
              {voiceFileName ? (
                <>
                  <p className="text-sm font-medium text-stone-800">{voiceFileName}</p>
                  <p className="text-xs text-stone-400 mt-1">Click to replace</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-stone-400">Drop your audio file here, or click to browse</p>
                  <p className="text-xs text-stone-300 mt-1">MP3, WAV, M4A</p>
                </>
              )}
            </div>
            <p className="text-xs text-orange-500 font-medium mt-2">
              The voiceover must match the script above exactly
            </p>
          </div>
        </StepRow>

        {/* Step 3 — Format */}
        <StepRow number={3} done={step3Active} active={step2Active} label="Format">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1.5">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={e => setOrientation(e.target.value as 'vertical' | 'horizontal')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 transition cursor-pointer"
                >
                  <option value="vertical">Vertical — 9:16 (Shorts / Reels)</option>
                  <option value="horizontal">Horizontal — 16:9 (YouTube)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1.5">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value as '2k' | '4k')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 transition cursor-pointer"
                >
                  <option value="2k">2K — 1080 × 1920 px</option>
                  <option value="4k">4K — 2160 × 3840 px</option>
                </select>
              </div>
            </div>
          </div>
        </StepRow>

        {/* Step 4 — AI split */}
        <StepRow number={4} active={step4Active} last={!hasSegments} label="AI split & clip matching">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            {analysisError && (
              <p className="text-xs text-red-500 mb-3">{analysisError}</p>
            )}
            <button
              onClick={handleAnalyse}
              disabled={!step4Active || analysing}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {analysing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analysing…
                </>
              ) : (
                '✦ AI — split into ideas and match clips →'
              )}
            </button>
            <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
              The script and audio are broken into semantic blocks. AI then finds the most fitting video for each one.
            </p>
          </div>
        </StepRow>

        {/* Segments */}
        {hasSegments && (
          <>
            <div className="flex items-center justify-between mt-5 mb-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                {segments.length} segments &nbsp;·&nbsp; {chosenCount} of {segments.length} clips chosen
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-stone-100 rounded-full mb-4">
              <div
                className="h-0.5 bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${segments.length ? (chosenCount / segments.length) * 100 : 0}%` }}
              />
            </div>

            {segments.map((seg, i) => (
              <SegmentBlock
                key={seg.id}
                seg={seg}
                index={i}
                onSelectClip={handleSelectClip}
                onLoadMoreMy={handleLoadMoreMy}
                onLoadMoreStock={handleLoadMoreStock}
                onDownloadPexels={handleDownloadPexels}
              />
            ))}

            {/* Export box */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 mt-3">
              {exportError && <p className="text-xs text-red-500 mb-3">{exportError}</p>}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-1 text-sm text-stone-500">
                  <strong className="text-stone-800">{chosenCount} of {segments.length}</strong> clips chosen
                  {!allChosen && ' — select all to export'}
                </span>
                <button
                  onClick={handleExport}
                  disabled={!allChosen || exporting}
                  className="shrink-0 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-200 disabled:text-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                >
                  {exporting ? 'Exporting…' : 'Export FCP XML →'}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Downloads <strong>project.fcpxml</strong> + chosen Pexels clips.
                Open in <strong>Final Cut Pro</strong> or <strong>DaVinci Resolve</strong> via File → Import,
                in <strong>Premiere Pro</strong> via File → Import XML.
              </p>
              <p className="text-[11px] text-stone-300 mt-1">
                Your personal stock clips stay on your computer — add them to your editor's media library manually.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showPicker && (
        <PickerModal
          scripts={scripts}
          longforms={longforms}
          loading={listsLoading}
          onSelect={t => { setText(t); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          onConfirm={() => { resetAll(); setShowConfirm(false) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </Layout>
  )
}
