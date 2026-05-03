import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fetchScripts, type ScriptResponse } from '../api/scripts'
import { fetchLongforms, type LongformResponse } from '../api/longforms'
import { LANGUAGES, LANG_FLAG } from '../data/languages'

// ── Constants ──────────────────────────────────────────────────────────────────

const MODAL_PAGE_SIZE = 8

// Edge TTS voices per language code.
// Preview URLs are from the official Microsoft Cognitive Services demo.
// Format: https://aka.ms/speech/tts/demo?voice=<voiceName>
// We play them inline via Audio() — no backend call needed.
const EDGE_VOICES: Record<string, { name: string; label: string; previewUrl: string }[]> = {
  ru: [
    { name: 'ru-RU-SvetlanaNeural',  label: 'Svetlana (F)',  previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=ru-RU-SvetlanaNeural&text=Привет!+Рад+вас+слышать.' },
    { name: 'ru-RU-DmitryNeural',    label: 'Dmitry (M)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=ru-RU-DmitryNeural&text=Привет!+Рад+вас+слышать.' },
    { name: 'ru-RU-DariyaNeural',    label: 'Dariya (F)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=ru-RU-DariyaNeural&text=Привет!+Рад+вас+слышать.' },
  ],
  es: [
    { name: 'es-ES-ElviraNeural',    label: 'Elvira (F)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=es-ES-ElviraNeural&text=Hola,+¿cómo+estás?' },
    { name: 'es-ES-AlvaroNeural',    label: 'Alvaro (M)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=es-ES-AlvaroNeural&text=Hola,+¿cómo+estás?' },
  ],
  pt: [
    { name: 'pt-BR-FranciscaNeural', label: 'Francisca (F)', previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=pt-BR-FranciscaNeural&text=Olá,+como+vai?' },
    { name: 'pt-BR-AntonioNeural',   label: 'Antonio (M)',   previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=pt-BR-AntonioNeural&text=Olá,+como+vai?' },
  ],
  fr: [
    { name: 'fr-FR-DeniseNeural',    label: 'Denise (F)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=fr-FR-DeniseNeural&text=Bonjour,+comment+allez-vous?' },
    { name: 'fr-FR-HenriNeural',     label: 'Henri (M)',     previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=fr-FR-HenriNeural&text=Bonjour,+comment+allez-vous?' },
  ],
  de: [
    { name: 'de-DE-KatjaNeural',     label: 'Katja (F)',     previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=de-DE-KatjaNeural&text=Hallo,+wie+geht+es+Ihnen?' },
    { name: 'de-DE-ConradNeural',    label: 'Conrad (M)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=de-DE-ConradNeural&text=Hallo,+wie+geht+es+Ihnen?' },
  ],
  uk: [
    { name: 'uk-UA-PolinaNeural',    label: 'Polina (F)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=uk-UA-PolinaNeural&text=Привіт!+Як+справи?' },
    { name: 'uk-UA-OstapNeural',     label: 'Ostap (M)',     previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=uk-UA-OstapNeural&text=Привіт!+Як+справи?' },
  ],
  hi: [
    { name: 'hi-IN-SwaraNeural',     label: 'Swara (F)',     previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=hi-IN-SwaraNeural&text=नमस्ते,+आप+कैसे+हैं?' },
    { name: 'hi-IN-MadhurNeural',    label: 'Madhur (M)',    previewUrl: 'https://ttsdemo.microsoft.com/api/TTS?voice=hi-IN-MadhurNeural&text=नमस्ते,+आप+कैसे+हैं?' },
  ],
}

// Orpheus voices for English
const ORPHEUS_VOICES = [
  { name: 'tara',  label: 'Tara (F)' },
  { name: 'leah',  label: 'Leah (F)' },
  { name: 'jess',  label: 'Jess (F)' },
  { name: 'leo',   label: 'Leo (M)' },
  { name: 'dan',   label: 'Dan (M)' },
  { name: 'mia',   label: 'Mia (F)' },
  { name: 'zac',   label: 'Zac (M)' },
  { name: 'zoe',   label: 'Zoe (F)' },
]

const EDGE_STYLES = ['Default', 'Cheerful', 'Serious', 'Calm', 'Empathetic', 'Newscast']

const LS = {
  lang:          'voiceLang',
  edgeVoice:     'voiceEdgeVoice',
  edgeStyle:     'voiceEdgeStyle',
  edgeSpeed:     'voiceEdgeSpeed',
  edgePitch:     'voiceEdgePitch',
  orpheusVoice:  'voiceOrpheusVoice',
  orpheusTemp:   'voiceOrpheusTemp',
}

function ls<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? (JSON.parse(v) as T) : fallback
  } catch { return fallback }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

type SourceTab = 'scripts' | 'longform'

// ── Component ──────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const { token } = useAuth()

  // Step 1 — text
  const [text, setText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<SourceTab>('scripts')
  const [modalSearch, setModalSearch] = useState('')
  const [modalPage, setModalPage] = useState(1)
  const [scripts, setScripts] = useState<ScriptResponse[]>([])
  const [longforms, setLongforms] = useState<LongformResponse[]>([])
  const [listsLoading, setListsLoading] = useState(false)

  // Step 2 — language
  const [lang, setLang] = useState<string>(() => ls(LS.lang, 'ru'))
  const [langAutoDetected, setLangAutoDetected] = useState(false)

  const isEnglish = lang === 'en'

  // Step 3 — voice settings
  const [edgeVoice, setEdgeVoice]   = useState<string>(() => ls(LS.edgeVoice, ''))
  const [edgeStyle, setEdgeStyle]   = useState<string>(() => ls(LS.edgeStyle, 'Default'))
  const [edgeSpeed, setEdgeSpeed]   = useState<number>(() => ls(LS.edgeSpeed, 100))
  const [edgePitch, setEdgePitch]   = useState<number>(() => ls(LS.edgePitch, 0))
  const [orpheusVoice, setOrpheusVoice] = useState<string>(() => ls(LS.orpheusVoice, 'tara'))
  const [orpheusTemp, setOrpheusTemp]   = useState<number>(() => ls(LS.orpheusTemp, 70))

  const [previewing, setPreviewing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Effective edge voice for current language
  const edgeVoicesForLang = EDGE_VOICES[lang] ?? []
  const effectiveEdgeVoice = edgeVoicesForLang.find(v => v.name === edgeVoice)
    ?? edgeVoicesForLang[0]

  // Step gates
  const step2Active = text.trim().length > 0
  const step3Active = step2Active
  const step4Active = step3Active

  // ── Modal data loading ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!modalOpen || !token) return
    if (scripts.length > 0 || longforms.length > 0) return
    setListsLoading(true)
    Promise.all([fetchScripts(token), fetchLongforms(token)])
      .then(([s, lf]) => { setScripts(s); setLongforms(lf) })
      .catch(() => {})
      .finally(() => setListsLoading(false))
  }, [modalOpen, token])

  const filteredScripts = useMemo(() => {
    const q = modalSearch.toLowerCase().trim()
    if (!q) return scripts
    return scripts.filter(s =>
      (s.name ?? '').toLowerCase().includes(q) ||
      s.fullText.toLowerCase().includes(q)
    )
  }, [scripts, modalSearch])

  const filteredLongforms = useMemo(() => {
    const q = modalSearch.toLowerCase().trim()
    if (!q) return longforms
    return longforms.filter(lf =>
      (lf.title ?? '').toLowerCase().includes(q) ||
      lf.fullText.toLowerCase().includes(q)
    )
  }, [longforms, modalSearch])

  const activeList = modalTab === 'scripts' ? filteredScripts : filteredLongforms
  const modalTotalPages = Math.ceil(activeList.length / MODAL_PAGE_SIZE)
  const modalPaginated = activeList.slice((modalPage - 1) * MODAL_PAGE_SIZE, modalPage * MODAL_PAGE_SIZE)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectScript = (s: ScriptResponse) => {
    setText(s.fullText)
    const detectedLang = s.outputLang ?? s.inputLang
    setLang(detectedLang)
    lsSet(LS.lang, detectedLang)
    setLangAutoDetected(true)
    closeModal()
  }

  const handleSelectLongform = (lf: LongformResponse) => {
    setText(lf.fullText)
    const detectedLang = lf.outputLang ?? lf.inputLang
    setLang(detectedLang)
    lsSet(LS.lang, detectedLang)
    setLangAutoDetected(true)
    closeModal()
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalSearch('')
    setModalPage(1)
    setLangAutoDetected(false)
  }

  const handleLangChange = (v: string) => {
    setLang(v)
    lsSet(LS.lang, v)
    setLangAutoDetected(false)
    // Reset edge voice so it picks the first for new language
    setEdgeVoice('')
  }

  const handleEdgeVoiceChange = (v: string) => { setEdgeVoice(v); lsSet(LS.edgeVoice, v) }
  const handleEdgeStyleChange = (v: string) => { setEdgeStyle(v); lsSet(LS.edgeStyle, v) }
  const handleEdgeSpeedChange = (v: number) => { setEdgeSpeed(v); lsSet(LS.edgeSpeed, v) }
  const handleEdgePitchChange = (v: number) => { setEdgePitch(v); lsSet(LS.edgePitch, v) }
  const handleOrpheusVoiceChange = (v: string) => { setOrpheusVoice(v); lsSet(LS.orpheusVoice, v) }
  const handleOrheusTempChange = (v: number) => { setOrpheusTemp(v); lsSet(LS.orpheusTemp, v) }

  // Preview: play pre-generated Orpheus sample (voice + expressiveness step)
  const handleOrpheusPreview = () => {
    setPreviewing(true)
    const tempLabel = (orpheusTemp / 10).toFixed(1)
    const url = `/voice-samples/orpheus/${orpheusVoice}_${tempLabel}.mp3`
    const audio = new Audio(url)
    audio.onended = () => setPreviewing(false)
    audio.onerror = () => setPreviewing(false)
    audio.play().catch(() => setPreviewing(false))
  }

  // Preview: play Microsoft's sample audio for the selected Edge voice
  const handlePreview = () => {
    if (isEnglish || !effectiveEdgeVoice) return
    setPreviewing(true)
    const audio = new Audio(effectiveEdgeVoice.previewUrl)
    audio.onended = () => setPreviewing(false)
    audio.onerror = () => {
      setPreviewing(false)
      setError('Preview unavailable. Try generating a short sample.')
    }
    audio.play().catch(() => setPreviewing(false))
  }

  const handleGenerate = async () => {
    if (!text.trim() || !token) return
    setGenerating(true)
    setError(null)
    try {
      const payload = isEnglish
        ? { text: text.trim(), lang, engine: 'orpheus', voice: orpheusVoice, temperature: orpheusTemp / 10 }
        : { text: text.trim(), lang, engine: 'edge', voice: effectiveEdgeVoice?.name, style: edgeStyle, speed: edgeSpeed / 100, pitch: edgePitch }

      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'generation_failed')
      }

      // Stream the MP3 blob straight to download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voiceover-${Date.now()}.mp3`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'rate_limit') setError('Too many requests. Please wait a moment.')
      else if (msg === 'timeout') setError('Generation timed out. Please try again.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const charCount = text.length

  return (
    <Layout breadcrumbs={[{ label: 'Voice' }]}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Voice</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            No voiceover yet? Generate one here and download it to your project folder.{' '}
            Already have your own recording?{' '}
            <Link to="/video" className="text-teal-600 hover:underline">Go to Video →</Link>
          </p>
        </div>

        {/* Step 1 — Text */}
        <StepRow number={1} active label="Text to voice">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-stone-700">What should be voiced?</p>
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition"
              >
                Pick from Scripts or Longform →
              </button>
            </div>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setLangAutoDetected(false) }}
              placeholder="Or paste your text here…"
              rows={6}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
            />
            <p className="text-[11px] text-stone-300 text-right mt-1">{charCount} chars</p>
          </div>
        </StepRow>

        {/* Step 2 — Language */}
        <StepRow number={2} active={step2Active} label="Language">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <select
                value={lang}
                onChange={e => handleLangChange(e.target.value)}
                disabled={!step2Active}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer disabled:opacity-40"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              {langAutoDetected && (
                <span className="text-[11px] font-semibold px-2 py-1 bg-teal-50 text-teal-600 border border-teal-200 rounded-md">
                  auto-detected
                </span>
              )}
            </div>
          </div>
        </StepRow>

        {/* Step 3 — Voice settings */}
        <StepRow number={3} active={step3Active} label="Voice settings">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            {!step3Active ? (
              <p className="text-sm text-stone-300">Available after you add text and choose a language.</p>
            ) : isEnglish ? (
              /* ── Orpheus settings ── */
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Voice</label>
                    <select
                      value={orpheusVoice}
                      onChange={e => handleOrpheusVoiceChange(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer"
                    >
                      {ORPHEUS_VOICES.map(v => (
                        <option key={v.name} value={v.name}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">
                      Expressiveness · {(orpheusTemp / 10).toFixed(1)}
                    </label>
                    <input
                      type="range" min={1} max={10} step={1}
                      value={orpheusTemp}
                      onChange={e => handleOrheusTempChange(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-stone-300 mt-0.5">
                      <span>0.1</span><span>1.0</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                  <button
                    onClick={handleOrpheusPreview}
                    disabled={previewing}
                    className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {previewing ? '▶ Playing…' : '▶ Preview voice'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Edge TTS settings ── */
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Voice</label>
                    <select
                      value={effectiveEdgeVoice?.name ?? ''}
                      onChange={e => handleEdgeVoiceChange(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer"
                    >
                      {edgeVoicesForLang.map(v => (
                        <option key={v.name} value={v.name}>{v.label}</option>
                      ))}
                      {edgeVoicesForLang.length === 0 && (
                        <option value="">Not available for this language</option>
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Style</label>
                    <select
                      value={edgeStyle}
                      onChange={e => handleEdgeStyleChange(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer"
                    >
                      {EDGE_STYLES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">
                      Speed · {(edgeSpeed / 100).toFixed(1)}×
                    </label>
                    <input
                      type="range" min={50} max={200} step={5}
                      value={edgeSpeed}
                      onChange={e => handleEdgeSpeedChange(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-stone-300 mt-0.5">
                      <span>0.5×</span><span>2.0×</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">
                      Pitch · {edgePitch > 0 ? `+${edgePitch}` : edgePitch}
                    </label>
                    <input
                      type="range" min={-50} max={50} step={5}
                      value={edgePitch}
                      onChange={e => handleEdgePitchChange(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-stone-300 mt-0.5">
                      <span>Lower</span><span>Higher</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-stone-100">
                  <button
                    onClick={handlePreview}
                    disabled={previewing || !effectiveEdgeVoice}
                    className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {previewing ? '▶ Playing…' : '▶ Preview voice'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </StepRow>

        {/* Step 4 — Generate */}
        <StepRow number={4} active={step4Active} last label="Generate & download">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={!step4Active || !text.trim() || generating}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition"
            >
              {generating ? 'Generating voiceover…' : 'Generate voiceover & download MP3'}
            </button>
            <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
              The file will download to your computer. Save it to your project folder —
              you'll import it in the{' '}
              <Link to="/video" className="text-teal-600 hover:underline">Video</Link> section.
            </p>
          </div>
        </StepRow>

      </div>

      {/* ── Picker Modal ───────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl flex flex-col"
            style={{ width: '90vw', maxWidth: 700, height: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 shrink-0">
              <h3 className="text-base font-semibold text-stone-900">Pick a text to voice</h3>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600 transition text-xl leading-none"
              >×</button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-1 shrink-0">
              {(['scripts', 'longform'] as SourceTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setModalTab(tab); setModalPage(1) }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition capitalize ${
                    modalTab === tab
                      ? 'bg-teal-600 text-white'
                      : 'text-stone-400 hover:text-stone-600 border border-stone-200'
                  }`}
                >
                  {tab === 'scripts' ? 'Scripts' : 'Longform'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-6 pt-3 pb-2 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${modalTab}…`}
                  value={modalSearch}
                  onChange={e => { setModalSearch(e.target.value); setModalPage(1) }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {listsLoading ? (
                <p className="text-sm text-stone-400 text-center py-10">Loading…</p>
              ) : modalPaginated.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-10">
                  {modalSearch ? `No results for "${modalSearch}"` : `No ${modalTab} yet`}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {modalTab === 'scripts'
                    ? (modalPaginated as ScriptResponse[]).map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectScript(s)}
                          className="text-left border rounded-xl px-4 py-3 transition bg-stone-50 hover:bg-teal-50 border-stone-200 hover:border-teal-300"
                        >
                          {s.name && (
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">{s.name}</p>
                          )}
                          <p className="text-sm text-stone-800 leading-relaxed line-clamp-2">{s.fullText}</p>
                          <p className="text-[11px] text-stone-300 mt-1.5">
                            {LANG_FLAG[s.outputLang ?? s.inputLang]} {s.updatedAt?.slice(0, 10)}
                          </p>
                        </button>
                      ))
                    : (modalPaginated as LongformResponse[]).map(lf => (
                        <button
                          key={lf.id}
                          onClick={() => handleSelectLongform(lf)}
                          className="text-left border rounded-xl px-4 py-3 transition bg-stone-50 hover:bg-teal-50 border-stone-200 hover:border-teal-300"
                        >
                          {lf.title && (
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">{lf.title}</p>
                          )}
                          <p className="text-sm text-stone-800 leading-relaxed line-clamp-2">{lf.fullText}</p>
                          <p className="text-[11px] text-stone-300 mt-1.5">
                            {LANG_FLAG[lf.outputLang ?? lf.inputLang]} {lf.updatedAt?.slice(0, 10)}
                          </p>
                        </button>
                      ))
                  }
                </div>
              )}
            </div>

            {/* Pagination */}
            {modalTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-stone-100 shrink-0">
                <button
                  onClick={() => setModalPage(p => Math.max(1, p - 1))}
                  disabled={modalPage === 1}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-xs text-stone-400">{modalPage} / {modalTotalPages}</span>
                <button
                  onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))}
                  disabled={modalPage === modalTotalPages}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── StepRow helper ─────────────────────────────────────────────────────────────

interface StepRowProps {
  number: number
  active: boolean
  label: string
  last?: boolean
  children: React.ReactNode
}

function StepRow({ number, active, label, last, children }: StepRowProps) {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition ${
          active ? 'bg-teal-600 text-white' : 'bg-stone-200 text-stone-400'
        }`}>
          {number}
        </div>
        {!last && (
          <div className={`w-px flex-1 mt-1 transition ${active ? 'bg-teal-200' : 'bg-stone-200'}`} style={{ minHeight: 16 }} />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 mt-1 transition ${
          active ? 'text-stone-500' : 'text-stone-300'
        }`}>
          {label}
        </p>
        <div className={active ? '' : 'opacity-40 pointer-events-none'}>
          {children}
        </div>
      </div>
    </div>
  )
}
