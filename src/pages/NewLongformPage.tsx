import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { generateLongform, refineLongform, saveLongform } from '../api/longforms'
import { fetchIdeas, markIdeaUsed, type IdeaResponse } from '../api/ideas'
import { LANGUAGES, LANG_FLAG } from '../data/languages'

// ── Constants ──────────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
  "I spent years chasing productivity systems — apps, routines, morning rituals. None of it worked until I realised the problem wasn't my habits. It was what I was optimising for.",
  "I tried to build a business three times and failed. The fourth attempt worked — and the only thing I changed was how I defined failure.",
  "Most people think creativity is a talent. I used to believe that too, until I accidentally stumbled on a process that made it feel more like a skill.",
  "I burned out at 28 working a job I thought I loved. Here's what I learned about the difference between passion and compulsion.",
  "I moved to a different country without a plan, a job, or a social network. It was the best and worst decision I've ever made.",
]

const MODAL_PAGE_SIZE = 8

const STYLE_OPTIONS = [
  { value: 'story', label: 'Story', hint: 'Personal narrative. Emotion builds slowly.' },
  { value: 'flow', label: 'Flow', hint: 'Smooth and natural. Easy to follow.' },
  { value: 'expert', label: 'Expert', hint: 'Authoritative. Facts, specifics, no fluff.' },
  { value: 'edge', label: 'Edge', hint: 'Provocative. Contrarian, dry wit.' },
  { value: 'spark', label: 'Spark', hint: 'Hits hard from the first line. Short punches, escalating.' },
]

const VOICE_OPTIONS = [
  { value: 'direct', label: 'Talk to the viewer' },
  { value: 'neutral', label: 'Impersonal fact' },
]

// label shown to user → character count sent to backend
const LENGTH_OPTIONS = [
  { value: 'short',    label: 'up to 3 min',  chars: 3000 },
  { value: 'medium',   label: '5–7 min',       chars: 6000 },
  { value: 'long',     label: '10–12 min',     chars: 11000 },
  { value: 'extended', label: '15+ min',       chars: 16000 },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  title: string
  text: string
  tr?: string
  instruction: string
  refining: boolean
  parentId?: string
}

// ── Variant card ───────────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: Variant
  showTr: boolean
  onSave: (v: Variant, title: string, text: string) => void
  onRefine: (id: string) => void
  onDelete: (id: string) => void
  onInstructionChange: (id: string, value: string) => void
  onTitleChange: (id: string, value: string) => void
  cardRef?: (el: HTMLDivElement | null) => void
}

function VariantCard({
  variant, showTr, onSave, onRefine, onDelete, onInstructionChange, onTitleChange, cardRef,
}: VariantCardProps) {
  const [title, setTitle] = useState(variant.title)
  const [text, setText] = useState(variant.text)

  return (
    <div ref={cardRef} className="bg-white border border-stone-200 rounded-xl overflow-hidden transition">

      {/* Title */}
      <div className="px-5 pt-5 pb-0">
        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); onTitleChange(variant.id, e.target.value) }}
          placeholder="Short title for this script…"
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
        />
      </div>

      {/* Script text */}
      <div className="px-5 pt-4 pb-3">
        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Script</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={20}
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 leading-relaxed outline-none resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
        />
        {showTr && variant.tr && (
          <p className="text-xs text-stone-400 italic leading-relaxed whitespace-pre-line border-t border-stone-100 pt-3 mt-1">
            {variant.tr}
          </p>
        )}
      </div>

      {/* Refine */}
      <div className="border-t border-stone-100 px-5 py-3 bg-stone-50/60">
        <div className="flex gap-2 items-start">
          <textarea
            value={variant.instruction}
            onChange={e => onInstructionChange(variant.id, e.target.value)}
            placeholder="Shorten the intro · Add more personal story · Make the conclusion stronger…"
            disabled={variant.refining}
            rows={3}
            className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-stone-300 disabled:opacity-50 resize-none"
          />
          <button
            onClick={() => onRefine(variant.id)}
            disabled={!variant.instruction.trim() || variant.refining}
            className="text-xs font-medium px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 text-white transition whitespace-nowrap"
          >
            {variant.refining ? 'Applying…' : 'Apply →'}
          </button>
        </div>
        <p className="text-[10px] text-stone-300 mt-1.5">
          A refined version will appear right after this one.
        </p>
      </div>

      {/* Actions */}
      <div className="border-t border-stone-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => onDelete(variant.id)}
          className="text-xs text-red-400 hover:text-red-500 transition"
        >
          Remove
        </button>
        <button
          onClick={() => onSave(variant, title, text)}
          className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition"
        >
          Save this version
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NewLongformPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const showTr = inputLang !== outputLang

  const [source, setSource] = useState('')
  const [coreMessage, setCoreMessage] = useState('')

  // Style, voice, length — persisted in localStorage
  const [style, setStyle] = useState<string>(() =>
    localStorage.getItem('longformStyle') ?? 'flow'
  )
  const [voice, setVoice] = useState<string>(() =>
    localStorage.getItem('longformVoice') ?? 'neutral'
  )
  const [length, setLength] = useState<string>(() =>
    localStorage.getItem('longformLength') ?? 'medium'
  )

  const handleStyleChange = (v: string) => { setStyle(v); localStorage.setItem('longformStyle', v) }
  const handleVoiceChange = (v: string) => { setVoice(v); localStorage.setItem('longformVoice', v) }
  const handleLengthChange = (v: string) => { setLength(v); localStorage.setItem('longformLength', v) }

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [variants, setVariants] = useState<Variant[]>([])
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [modalShowUsed, setModalShowUsed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalPage, setModalPage] = useState(1)
  const [ideas, setIdeas] = useState<IdeaResponse[]>([])
  const [ideasLoading, setIdeasLoading] = useState(false)

  const [placeholder] = useState(
    () => 'E.g.: ' + PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )

  useEffect(() => {
    if (!modalOpen || ideas.length > 0 || !token) return
    setIdeasLoading(true)
    fetchIdeas(token)
      .then(setIdeas)
      .catch(() => {})
      .finally(() => setIdeasLoading(false))
  }, [modalOpen, token])

  const filteredIdeas = useMemo(() => {
    const q = modalSearch.toLowerCase().trim()
    let list = modalShowUsed ? ideas.filter(i => i.used) : ideas.filter(i => !i.used)
    if (q) list = list.filter(i =>
      i.idea.toLowerCase().includes(q) || i.source.toLowerCase().includes(q)
    )
    return list
  }, [ideas, modalSearch, modalShowUsed])

  const modalTotalPages = Math.ceil(filteredIdeas.length / MODAL_PAGE_SIZE)
  const modalPaginated = filteredIdeas.slice((modalPage - 1) * MODAL_PAGE_SIZE, modalPage * MODAL_PAGE_SIZE)
  const usedCount = useMemo(() => ideas.filter(i => i.used).length, [ideas])

  const currentLengthChars = LENGTH_OPTIONS.find(l => l.value === length)?.chars ?? 6000
  const currentStyleHint = STYLE_OPTIONS.find(s => s.value === style)?.hint

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!source.trim() || !token) return
    setGenerating(true)
    setError(null)
    setGenerated(false)
    setVariants([])
    try {
      const result = await generateLongform(
        source, coreMessage, inputLang, outputLang, token,
        style, voice, String(currentLengthChars)
      )
      setVariants([{
        id: `v0-${Date.now()}`,
        title: result.title ?? '',
        text: result.text,
        tr: result.tr,
        instruction: '',
        refining: false,
      }])
      setGenerated(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'moderation') setError("This content couldn't be processed. Try rephrasing.")
      else if (msg === 'rate_limit') setError('Too many requests. Please wait a moment.')
      else if (msg === 'timeout') setError('AI is taking too long. Please try again.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRefine = async (id: string) => {
    const variant = variants.find(v => v.id === id)
    if (!variant || !token) return
    setVariants(prev => prev.map(v => v.id === id ? { ...v, refining: true } : v))
    try {
      const result = await refineLongform(variant.text, variant.instruction, inputLang, outputLang, token)
      const newId = `${id}-r${Date.now()}`
      const newVariant: Variant = {
        id: newId,
        title: variant.title,
        text: result.text,
        tr: result.tr,
        instruction: '',
        refining: false,
        parentId: id,
      }
      setVariants(prev => {
        const updated = prev.map(v => v.id === id ? { ...v, refining: false, instruction: '' } : v)
        const idx = updated.findIndex(v => v.id === id)
        updated.splice(idx + 1, 0, newVariant)
        return [...updated]
      })
      setTimeout(() => {
        cardRefs.current[newId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch {
      setVariants(prev => prev.map(v => v.id === id ? { ...v, refining: false } : v))
      setError('Failed to refine. Please try again.')
    }
  }

  const handleDelete = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  const handleSave = async (variant: Variant, title: string, text: string) => {
    if (!token) return
    try {
      await saveLongform(
        source, coreMessage, title, text,
        variant.tr, inputLang, outputLang, token
      )
      setVariants(prev => prev.filter(v => v.id !== variant.id))
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const handleSelectIdea = (idea: IdeaResponse) => {
    setCoreMessage(idea.idea)
    if (!source.trim()) setSource(idea.source)
    setModalOpen(false)
    setModalSearch('')
    setModalPage(1)
    if (token && !idea.used) {
      markIdeaUsed(idea.id, true, token)
        .then(updated => setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i)))
        .catch(() => {})
    }
  }

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[id] = el
  }, [])

  const updateInstruction = (id: string, value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, instruction: value } : v))
  }

  const updateTitle = (id: string, value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, title: value } : v))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout breadcrumbs={[{ label: 'Longform', to: '/longform' }, { label: 'New Longform Script' }]}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">New Longform Script</h1>
          <p className="text-stone-400 text-sm">
            AI-assisted scripting for long-form YouTube videos. Tell your story in depth — the AI will help you shape it into a structured, engaging script.
          </p>
        </div>

        {/* Prompt guide */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-5 py-4 mb-5 text-sm text-teal-800 leading-relaxed space-y-1">
          <p>What problem do you want to explore in this video?</p>
          <p>How did it start, and when did you first become aware of it?</p>
          <p>What solutions have you found, and how did you get there?</p>
          <p>What have you already tried, and where do things stand now?</p>
          <p className="text-teal-600 text-xs pt-1">
            The more specific you are, the better. Feel free to describe the mood, style, or target audience.
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3 mb-4 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <span className="text-xs text-stone-500 font-medium shrink-0">Language:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">Input</label>
            <select value={inputLang} onChange={e => setInputLang(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className="text-stone-300 text-sm">→</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">Output</label>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className={`text-xs ml-auto italic ${showTr ? 'text-teal-500' : 'text-stone-400'}`}>
            {showTr ? 'Translation on' : 'No translation'}
          </span>
        </div>

        {/* Input card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">What's this video about?</p>
            <button onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition">
              Pick from Ideas →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Description *</label>
              <textarea value={source} onChange={e => setSource(e.target.value)}
                placeholder={placeholder}
                rows={7}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Core message</label>
              <textarea value={coreMessage} onChange={e => setCoreMessage(e.target.value)}
                placeholder="The central argument or takeaway — what should the viewer walk away believing or doing?"
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>

            {/* Style, Voice, Length */}
            <div className="flex items-start gap-3 pt-1">
              <div className="flex-1">
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Style</label>
                <select value={style} onChange={e => handleStyleChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer">
                  {STYLE_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {currentStyleHint && (
                  <p className="text-[11px] text-stone-400 italic mt-1">{currentStyleHint}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Voice</label>
                <select value={voice} onChange={e => handleVoiceChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer">
                  {VOICE_OPTIONS.map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Length</label>
                <select value={length} onChange={e => handleLengthChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer">
                  {LENGTH_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => navigate('/longform')}
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              ← Longform
            </button>
            <button
              onClick={handleGenerate}
              disabled={!source.trim() || generating}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              {generating ? 'Generating…' : 'Generate script →'}
            </button>
          </div>
        </div>

        {/* Generated variant */}
        {generated && variants.length > 0 && (
          <div>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-stone-900 mb-1">
                Your script, ready to shape
              </h2>
              <p className="text-xs text-stone-400">
                Edit directly, or describe what to change and hit Apply — refined version appears right after.
                Save when you're happy.
              </p>
            </div>

            <div className="flex flex-col gap-6 pb-16">
              {variants.map(variant => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  showTr={showTr}
                  onSave={handleSave}
                  onRefine={handleRefine}
                  onDelete={handleDelete}
                  onInstructionChange={updateInstruction}
                  onTitleChange={updateTitle}
                  cardRef={setCardRef(variant.id)}
                />
              ))}
            </div>
          </div>
        )}

        {generated && variants.length === 0 && (
          <div className="text-center py-10 text-stone-400 text-sm">
            <p className="mb-3">Version removed.</p>
            <button
              onClick={() => { setGenerated(false); setError(null) }}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition"
            >
              Generate again
            </button>
          </div>
        )}
      </div>

      {/* Ideas picker modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl flex flex-col"
            style={{ width: '90vw', height: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 shrink-0">
              <h3 className="text-base font-semibold text-stone-900">Pick an idea</h3>
              <div className="flex items-center gap-2">
                {usedCount > 0 && (
                  <button
                    onClick={() => { setModalShowUsed(p => !p); setModalPage(1) }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${modalShowUsed
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100'
                    }`}
                  >
                    {modalShowUsed ? '← All ideas' : `Show used (${usedCount})`}
                  </button>
                )}
                <button onClick={() => setModalOpen(false)}
                  className="text-stone-400 hover:text-stone-600 transition text-xl leading-none ml-1">×</button>
              </div>
            </div>

            <div className="px-6 pt-4 pb-3 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input type="text" placeholder="Search ideas…" value={modalSearch}
                  onChange={e => { setModalSearch(e.target.value); setModalPage(1) }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {ideasLoading ? (
                <p className="text-sm text-stone-400 text-center py-10">Loading…</p>
              ) : filteredIdeas.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-10">
                  {modalSearch ? `No ideas match "${modalSearch}"` : 'No ideas yet'}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {modalPaginated.map(idea => {
                    const hasTranslation = idea.inputLang !== idea.outputLang && idea.ideaTr
                    return (
                      <button key={idea.id}
                        onClick={() => handleSelectIdea(idea)}
                        className="text-left border rounded-xl px-4 py-3 transition bg-stone-50 hover:bg-teal-50 border-stone-200 hover:border-teal-300">
                        {hasTranslation ? (
                          <>
                            <p className="text-sm text-stone-800 leading-relaxed">{idea.ideaTr}</p>
                            <p className="text-xs text-stone-400 mt-1 leading-relaxed italic">{idea.idea}</p>
                          </>
                        ) : (
                          <p className="text-sm text-stone-800 leading-relaxed">{idea.idea}</p>
                        )}
                        {idea.source && (
                          <p className="text-xs text-stone-300 mt-1.5 truncate">{idea.source}</p>
                        )}
                        {hasTranslation && (
                          <p className="text-xs text-stone-300 mt-1">
                            {LANG_FLAG[idea.inputLang]} → {LANG_FLAG[idea.outputLang]}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {modalTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-stone-100 shrink-0">
                <button onClick={() => setModalPage(p => Math.max(1, p - 1))} disabled={modalPage === 1}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
                  ← Prev
                </button>
                <span className="text-xs text-stone-400">{modalPage} / {modalTotalPages}</span>
                <button onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))} disabled={modalPage === modalTotalPages}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
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
