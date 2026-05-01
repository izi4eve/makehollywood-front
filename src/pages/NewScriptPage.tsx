import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { generateScripts, refineScript, saveScript } from '../api/scripts'
import { fetchIdeas, markIdeaUsed, type IdeaResponse } from '../api/ideas'
import { LANGUAGES, LANG_FLAG } from '../data/languages'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  text: string
  tr?: string
  name?: string
  instruction: string
  refining: boolean
  saved: boolean
  parentId?: string   // which variant triggered refine
}

const PLACEHOLDERS = [
  "Toothpaste is the cheapest and fastest way to polish headlights.",
  "They say read 100 books to get rich. I read more and didn't. Then I realised — the only book worth writing is your own.",
  "The biggest mistake in photography: putting the subject in the centre of the frame.",
  "I tried a lot of diets. All of them worked temporarily and painfully. The only thing that stuck was the insulin index diet.",
  "Less than 1% of people try to start a business. 9 out of 10 fail in year one. Success rate: 0.3%.",
  "Everyone worries AI will take all jobs. But human needs are the entire foundation of any economy.",
]

const MODAL_PAGE_SIZE = 8

// ── Variant card ──────────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: Variant
  index: number
  showTr: boolean
  onSave: (v: Variant, text: string) => void
  onRefine: (id: string) => void
  onDelete: (id: string) => void
  onInstructionChange: (id: string, value: string) => void
  onNameChange: (id: string, value: string) => void
  cardRef?: (el: HTMLDivElement | null) => void
}

function VariantCard({
  variant, index, showTr, onSave, onRefine, onDelete, onInstructionChange, onNameChange, cardRef,
}: VariantCardProps) {
  const [text, setText] = useState(variant.text)

  return (
    <div ref={cardRef} className={`bg-white border rounded-xl overflow-hidden transition ${
      variant.saved ? 'border-green-300' : 'border-stone-200'
    }`}>

      {/* Version label */}
      <div className="px-5 pt-3 pb-0">
        <p className="text-[10px] text-stone-300 uppercase tracking-widest">Version {index + 1}</p>
      </div>

      {/* Name field */}
      <div className="px-5 pt-2 pb-2">
        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Name</label>
        <input
          type="text"
          value={variant.name ?? ''}
          onChange={e => onNameChange(variant.id, e.target.value)}
          placeholder="Short title for this script…"
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
        />
      </div>

      {/* Script text */}
      <div className="px-5 pb-3">
        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Script</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 leading-relaxed outline-none resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
        />
        {showTr && variant.tr && (
          <p className="text-xs text-stone-400 italic leading-relaxed whitespace-pre-line border-t border-stone-100 pt-3 mt-1">
            {variant.tr}
          </p>
        )}
      </div>

      {/* Refine field */}
      <div className="border-t border-stone-100 px-5 py-3 bg-stone-50/60">
        <div className="flex gap-2 items-start">
          <textarea
            value={variant.instruction}
            onChange={e => onInstructionChange(variant.id, e.target.value)}
            placeholder="Make shorter · Change hook · Make it punchier…"
            disabled={variant.refining}
            rows={2}
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
        {variant.saved ? (
          <span className="text-xs text-green-600 font-medium">✓ Saved</span>
        ) : (
          <button
            onClick={() => onSave(variant, text)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition"
          >
            Save this version
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewScriptPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const showTr = inputLang !== outputLang

  const [source, setSource] = useState('')
  const [coreMessage, setCoreMessage] = useState('')

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [variants, setVariants] = useState<Variant[]>([])

  // refs for auto-scroll to refined variant
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Ideas picker modal
  const [modalShowUsed, setModalShowUsed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalPage, setModalPage] = useState(1)
  const [ideas, setIdeas] = useState<IdeaResponse[]>([])
  const [ideasLoading, setIdeasLoading] = useState(false)

  const [placeholder] = useState(
    () => 'Sample: ' + PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!source.trim() || !token) return
    setGenerating(true)
    setError(null)
    setGenerated(false)
    setVariants([])
    try {
      const results = await generateScripts(source, coreMessage, inputLang, outputLang, token)
      setVariants(results.map((r, i) => ({
        id: `v${i}-${Date.now()}`,
        text: r.text,
        tr: r.tr,
        name: r.name ?? '',
        instruction: '',
        refining: false,
        saved: false,
      })))
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
      const result = await refineScript(variant.text, variant.instruction, inputLang, outputLang, token)
      const newId = `${id}-r${Date.now()}`
      const newVariant: Variant = {
        id: newId,
        text: result.text,
        tr: result.tr,
        name: variant.name,
        instruction: '',
        refining: false,
        saved: false,
        parentId: id,
      }
      // Insert right after parent
      setVariants(prev => {
        const updated = prev.map(v => v.id === id ? { ...v, refining: false, instruction: '' } : v)
        const idx = updated.findIndex(v => v.id === id)
        updated.splice(idx + 1, 0, newVariant)
        return [...updated]
      })
      // Scroll to new variant after render
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

  const handleSave = async (variant: Variant, text: string) => {
    if (!token) return
    try {
      await saveScript(
        source,
        coreMessage,
        variant.name ?? '',
        text,
        variant.tr,
        inputLang,
        outputLang,
        token
      )
      // Mark as saved but stay on page
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

  const updateName = (id: string, value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, name: value } : v))
  }

  const savedCount = variants.filter(v => v.saved).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout breadcrumbs={[{ label: 'Scripts', to: '/scripts' }, { label: 'New Script' }]}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">New Script</h1>
          <p className="text-stone-400 text-sm">
            What useful thing do you want to tell your viewer? Your experience, mistakes, observations, solutions. Top tips, secrets, facts, research, what's new. Spotted a lie or disagree with something everyone accepts? Share your take.
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
            <p className="text-sm font-medium text-stone-700">What's your video about?</p>
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
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Core message</label>
              <textarea value={coreMessage} onChange={e => setCoreMessage(e.target.value)}
                placeholder="The core insight — problem + solution or pain + advice"
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => navigate('/scripts')}
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              ← Scripts
            </button>
            <button
              onClick={handleGenerate}
              disabled={!source.trim() || generating}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              {generating ? 'Generating…' : 'Generate scripts →'}
            </button>
          </div>
        </div>

        {/* Generated variants */}
        {generated && variants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-stone-900 mb-1">
                  {variants.length} script{variants.length > 1 ? 's' : ''}, ready to use
                </h2>
                <p className="text-xs text-stone-400">
                  Edit directly, or describe what to change and hit Apply — refined version appears right after.
                  Save whichever versions you like.
                </p>
              </div>
              {savedCount > 0 && (
                <button
                  onClick={() => navigate('/scripts')}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition whitespace-nowrap ml-4"
                >
                  → Go to Scripts ({savedCount})
                </button>
              )}
            </div>

            <div className="flex flex-col gap-6 pb-16">
              {variants.map((variant, i) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  index={i}
                  showTr={showTr}
                  onSave={handleSave}
                  onRefine={handleRefine}
                  onDelete={handleDelete}
                  onInstructionChange={updateInstruction}
                  onNameChange={updateName}
                  cardRef={setCardRef(variant.id)}
                />
              ))}
            </div>
          </div>
        )}

        {generated && variants.length === 0 && (
          <div className="text-center py-10 text-stone-400 text-sm">
            <p className="mb-3">All versions removed.</p>
            <button
              onClick={() => { setGenerated(false); setError(null) }}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition"
            >
              Generate again
            </button>
          </div>
        )}
      </div>

      {/* Ideas picker modal — 90% screen */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl flex flex-col"
            style={{ width: '90vw', height: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 shrink-0">
              <h3 className="text-base font-semibold text-stone-900">Pick an idea</h3>
              <div className="flex items-center gap-2">
                {usedCount > 0 && (
                  <button
                    onClick={() => { setModalShowUsed(p => !p); setModalPage(1) }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      modalShowUsed
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

            {/* Search */}
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

            {/* Ideas list */}
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
                        {/* Show translation as primary if available */}
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
