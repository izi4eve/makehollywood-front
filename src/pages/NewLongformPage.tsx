import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'uk', label: '🇺🇦 Українська' },
]

const PLACEHOLDERS = [
  "I spent years chasing productivity systems — apps, routines, morning rituals. None of it worked until I realised the problem wasn't my habits. It was what I was optimising for.",
  "I tried to build a business three times and failed. The fourth attempt worked — and the only thing I changed was how I defined failure.",
  "Most people think creativity is a talent. I used to believe that too, until I accidentally stumbled on a process that made it feel more like a skill.",
  "I burned out at 28 working a job I thought I loved. Here's what I learned about the difference between passion and compulsion.",
  "I moved to a different country without a plan, a job, or a social network. It was the best and worst decision I've ever made.",
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneratedVariant {
  id: string
  title: string
  text: string
  tr?: string
  instruction: string
  refining: boolean
  children: RefinedVariant[]
}

interface RefinedVariant {
  id: string
  title: string
  text: string
  tr?: string
  instruction: string
  refining: boolean
  children: RefinedVariant[]
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockIdeas = [
  { id: 'i1', idea: 'Productivity systems only work when you\'ve figured out what you actually want to produce.', note: 'Personal story + framework' },
  { id: 'i2', idea: 'The moment you start optimising your life, you risk optimising the meaning out of it.', note: '' },
  { id: 'i3', idea: 'Burnout doesn\'t come from working too hard — it comes from working on the wrong things for too long.', note: 'Based on personal experience' },
]

const mockGenerated: GeneratedVariant = {
  id: 'v1',
  title: 'Why Every Productivity System I Tried Failed — And What Finally Worked',
  text: `There's a moment most people who are serious about their work will recognise. You've read the books. You've built the system. You've got the morning routine, the time-blocking, the app that tracks your habits. And still — at the end of another full day — you feel like you haven't really done anything that matters.

I spent two years in that loop. Not because I was lazy or undisciplined. If anything, I was too disciplined — executing with precision on a plan that was pointing in the wrong direction entirely.

The first system I tried was Getting Things Done. Classic. I captured everything, processed everything, reviewed everything. My lists were immaculate. My actual work was mediocre.

Then came time-blocking. Four-hour deep work sessions, Pomodoros, inbox-zero rituals. I got faster at shallow tasks. The deeper questions I kept avoiding got no clearer.

What changed wasn't a new tool or a better framework. It was a single question I stopped being afraid to ask: what would actually matter in ten years?

The answer was uncomfortable, because it didn't match what I was spending my time on.

That gap — between what you say matters and how you spend your hours — is where almost every productivity failure lives. Not in the tools. Not in the habits. In the misalignment between the life you're performing and the life you actually want.

This video isn't about a system. It's about what happens when you stop trying to optimise the wrong thing.`,
  tr: `Есть момент, который узнает каждый, кто серьёзно относится к своей работе. Ты прочитал книги. Выстроил систему. У тебя есть утренний ритуал, тайм-блокинг, приложение для трекинга привычек. И всё равно — в конце ещё одного насыщенного дня — ощущение, что ничего по-настоящему важного сделано не было.

Я провёл в этом круге два года. Не потому что был ленивым или несобранным. Скорее наоборот — действовал с точностью, но двигался не в ту сторону.

Первой системой была Getting Things Done. Классика. Я фиксировал всё, обрабатывал всё, пересматривал всё. Списки были безупречны. Сама работа — посредственной.

Потом пришло время тайм-блокинга. Четырёхчасовые сессии глубокого фокуса, помодоро, ритуалы нулевого инбокса. Я стал быстрее в мелких задачах. Глубокие вопросы, которых я избегал, светлее не стали.

Изменил всё не новый инструмент и не более умный фреймворк. Это был единственный вопрос, который я наконец перестал бояться задать себе: что будет важно через десять лет?

Ответ оказался неудобным — он не совпадал с тем, на что я тратил время.

Этот разрыв — между тем, что ты называешь важным, и тем, как на самом деле проходят твои часы — и есть место, где живёт почти каждый провал продуктивности. Не в инструментах. Не в привычках. В несоответствии между жизнью, которую ты разыгрываешь, и жизнью, которой ты хочешь.

Это видео не о системе. Это о том, что происходит, когда перестаёшь оптимизировать не то.`,
  instruction: '',
  refining: false,
  children: [],
}

// ── Variant card ───────────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: GeneratedVariant | RefinedVariant
  showTr: boolean
  depth?: number
  onSave: (title: string, text: string) => void
  onInstructionChange: (id: string, value: string) => void
  onRefine: (id: string) => void
  onDelete: (id: string) => void
}

function VariantCard({
  variant,
  showTr,
  depth = 0,
  onSave,
  onInstructionChange,
  onRefine,
  onDelete,
}: VariantCardProps) {
  const [title, setTitle] = useState(variant.title)
  const [text, setText] = useState(variant.text)
  const isRefining = variant.refining

  return (
    <div className={`${depth > 0 ? 'ml-5 border-l-2 border-stone-100 pl-4' : ''}`}>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">

        {/* Title field */}
        <div className="px-5 pt-5 pb-0">
          <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
          />
        </div>

        {/* Text field */}
        <div className="px-5 pt-4 pb-3">
          <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Script</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={16}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 leading-relaxed outline-none resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
          />

          {/* Translation */}
          {showTr && variant.tr && (
            <p className="text-xs text-stone-400 italic leading-relaxed whitespace-pre-line border-t border-stone-100 pt-3 mt-1">
              {variant.tr}
            </p>
          )}
        </div>

        {/* Instruction field */}
        <div className="border-t border-stone-100 px-5 py-3 bg-stone-50/60">
          <div className="flex gap-2 items-start">
            <textarea
              value={variant.instruction}
              onChange={e => onInstructionChange(variant.id, e.target.value)}
              placeholder="Shorten the intro · Add more personal story · Translate to German · Make the conclusion stronger…"
              disabled={isRefining}
              rows={3}
              className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-stone-300 disabled:opacity-50 resize-none"
            />
            <button
              onClick={() => onRefine(variant.id)}
              disabled={!variant.instruction.trim() || isRefining}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 text-white transition whitespace-nowrap"
            >
              {isRefining ? 'Applying…' : 'Apply →'}
            </button>
          </div>
          <p className="text-[10px] text-stone-300 mt-1.5">
            A refined version will appear below — your current text stays untouched.
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-stone-100 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => onDelete(variant.id)}
            className="text-xs text-red-400 hover:text-stone-400 transition"
          >
            Remove
          </button>
          <button
            onClick={() => onSave(title, text)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition"
          >
            Save this version
          </button>
        </div>
      </div>

      {/* Refined children */}
      {variant.children.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          {variant.children.map(child => (
            <VariantCard
              key={child.id}
              variant={child}
              showTr={showTr}
              depth={depth + 1}
              onSave={onSave}
              onInstructionChange={onInstructionChange}
              onRefine={onRefine}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NewLongformPage() {
  const navigate = useNavigate()

  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const showTr = inputLang !== outputLang

  const [source, setSource] = useState('')
  const [ideaText, setIdeaText] = useState('')
  const [note, setNote] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const [variants, setVariants] = useState<GeneratedVariant[]>([])

  const [placeholder] = useState(
    () => 'E.g.: ' + PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )

  const filteredIdeas = mockIdeas.filter(i =>
    i.idea.toLowerCase().includes(modalSearch.toLowerCase())
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!source.trim() && !ideaText.trim()) return
    setGenerating(true)
    setTimeout(() => {
      setVariants([{ ...mockGenerated }])
      setGenerating(false)
      setGenerated(true)
    }, 1600)
  }

  const handleSelectIdea = (idea: typeof mockIdeas[0]) => {
    setIdeaText(idea.idea)
    setNote(idea.note)
    setModalOpen(false)
    setModalSearch('')
  }

  const updateInstruction = (id: string, value: string) => {
    setVariants(prev => updateInTree(prev, id, v => ({ ...v, instruction: value })))
  }

  const handleRefine = (id: string) => {
    setVariants(prev => updateInTree(prev, id, v => ({ ...v, refining: true })))
    setTimeout(() => {
      const childId = `${id}-r${Date.now()}`
      const child: RefinedVariant = {
        id: childId,
        title: `[Refined title based on: "${getInstruction(id)}"]`,
        text: `[Refined version based on: "${getInstruction(id)}"]\n\nThis is where the AI-refined text would appear. The original structure is preserved but adjusted per your instruction.`,
        tr: showTr ? `[Перевод улучшенной версии]` : undefined,
        instruction: '',
        refining: false,
        children: [],
      }
      setVariants(prev =>
        updateInTree(prev, id, v => ({
          ...v,
          refining: false,
          instruction: '',
          children: [...v.children, child],
        }))
      )
    }, 1400)
  }

  const handleDelete = (id: string) => {
    setVariants(prev => deleteFromTree(prev, id))
  }

  const handleSave = (_title: string, _text: string) => {
    // TODO: save to backend
    navigate('/longform')
  }

  // ── Tree helpers ─────────────────────────────────────────────────────────────

  function getInstruction(id: string): string {
    return findInTree(variants, id)?.instruction ?? ''
  }

  function findInTree(
    nodes: (GeneratedVariant | RefinedVariant)[],
    id: string
  ): (GeneratedVariant | RefinedVariant) | null {
    for (const n of nodes) {
      if (n.id === id) return n
      const found = findInTree(n.children, id)
      if (found) return found
    }
    return null
  }

  function updateInTree(
    nodes: GeneratedVariant[],
    id: string,
    fn: (v: GeneratedVariant | RefinedVariant) => GeneratedVariant | RefinedVariant
  ): GeneratedVariant[] {
    return nodes.map(n => {
      if (n.id === id) return fn(n) as GeneratedVariant
      return { ...n, children: updateChildrenInTree(n.children, id, fn) }
    })
  }

  function updateChildrenInTree(
    nodes: RefinedVariant[],
    id: string,
    fn: (v: GeneratedVariant | RefinedVariant) => GeneratedVariant | RefinedVariant
  ): RefinedVariant[] {
    return nodes.map(n => {
      if (n.id === id) return fn(n) as RefinedVariant
      return { ...n, children: updateChildrenInTree(n.children, id, fn) }
    })
  }

  function deleteFromTree(nodes: GeneratedVariant[], id: string): GeneratedVariant[] {
    return nodes
      .filter(n => n.id !== id)
      .map(n => ({ ...n, children: deleteChildrenFromTree(n.children, id) }))
  }

  function deleteChildrenFromTree(nodes: RefinedVariant[], id: string): RefinedVariant[] {
    return nodes
      .filter(n => n.id !== id)
      .map(n => ({ ...n, children: deleteChildrenFromTree(n.children, id) }))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Layout breadcrumbs={[{ label: 'Longform', to: '/longform' }, { label: 'New Script' }]}>
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
            <select
              value={inputLang}
              onChange={e => setInputLang(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className="text-stone-300 text-sm">→</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">Output</label>
            <select
              value={outputLang}
              onChange={e => setOutputLang(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className={`text-xs ml-auto italic ${showTr ? 'text-teal-500' : 'text-stone-400'}`}>
            {showTr ? 'Translation on' : 'No translation'}
          </span>
        </div>

        {/* Input form */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">What's this video about?</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-teal-600 hover:text-teal-500 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition"
            >
              Pick from Ideas →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Description *</label>
              <textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder={placeholder}
                rows={7}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Core message</label>
              <textarea
                value={ideaText}
                onChange={e => setIdeaText(e.target.value)}
                placeholder="The central argument or takeaway — what should the viewer walk away believing or doing?"
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Tone, target audience, pacing, visual style, anything you'd tell a co-writer…"
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleGenerate}
              disabled={(!source.trim() && !ideaText.trim()) || generating}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
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
                Edit directly, or describe what to change and hit Apply — a refined version will appear below your original. Save when you're happy.
              </p>
            </div>

            <div className="flex flex-col gap-6 pb-16">
              {variants.map(variant => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  showTr={showTr}
                  depth={0}
                  onSave={handleSave}
                  onInstructionChange={updateInstruction}
                  onRefine={handleRefine}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Idea picker modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-stone-900">Pick an idea</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition text-lg leading-none"
              >×</button>
            </div>

            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search ideas…"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {filteredIdeas.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">No ideas found</p>
              ) : filteredIdeas.map(idea => (
                <button
                  key={idea.id}
                  onClick={() => handleSelectIdea(idea)}
                  className="text-left bg-stone-50 hover:bg-teal-50 border border-stone-200 hover:border-teal-300 rounded-xl px-4 py-3 transition"
                >
                  <p className="text-sm text-stone-800 leading-relaxed">{idea.idea}</p>
                  {idea.note && (
                    <p className="text-xs text-stone-400 mt-1 italic">{idea.note}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
