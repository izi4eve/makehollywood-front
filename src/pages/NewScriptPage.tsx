import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

// ── Types ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'uk', label: '🇺🇦 Українська' },
]

interface GeneratedVariant {
  id: string
  text: string         // output language
  tr?: string          // translation back to input language (if langs differ)
  instruction: string  // current instruction field value
  refining: boolean    // is AI currently refining this variant
  children: RefinedVariant[]
}

interface RefinedVariant {
  id: string
  text: string
  tr?: string
  instruction: string
  refining: boolean
  children: RefinedVariant[]
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockIdeas = [
  { id: 'i1', idea: 'If you avoid notifications and news first thing in the morning, you stay productive for much longer.', note: 'Morning routine series?' },
  { id: 'i2', idea: 'Checking messages first thing puts your brain in reactive mode — and it never fully recovers that day.', note: '' },
  { id: 'i3', idea: 'Just 30 minutes without your phone in the morning can drop anxiety and close tasks you\'ve been avoiding for months.', note: 'Personal story angle.' },
]

const mockGenerated: GeneratedVariant[] = [
  {
    id: 'v1',
    text: `Most people lose 2 hours every morning — and they have no idea.
The moment you check your phone, your brain switches into reactive mode. You stop thinking about your goals and start responding to everyone else's.
I tracked this for 14 days. On mornings without the scroll, I finished 2x more meaningful work before noon.
No phone for the first 30 minutes after waking up. That window is yours — protect it.
Does this sound too simple? Try it tomorrow and tell me what changed.`,
    tr: `Большинство людей теряют 2 часа каждое утро — и даже не догадываются об этом.
В момент, когда ты берёшь телефон, мозг переходит в реактивный режим. Ты перестаёшь думать о своих целях и начинаешь отвечать на чужие.
Я отслеживал это 14 дней. В дни без утреннего скроллинга я делал в 2 раза больше значимой работы до полудня.
Никакого телефона первые 30 минут после пробуждения. Это окно — твоё. Защищай его.
Звучит слишком просто? Попробуй завтра и напиши, что изменилось.`,
    instruction: '',
    refining: false,
    children: [],
  },
  {
    id: 'v2',
    text: `This one habit doubled my output — and it has nothing to do with waking up at 5am.
You'd think it's some complex system. It's not.
In 7 days, my anxiety dropped noticeably. I closed 3 projects I'd been avoiding for months.
The habit: no phone for the first 30 minutes of the day. That's it.
What's the first thing you do after waking up? Drop it below 👇`,
    tr: `Эта одна привычка удвоила мою продуктивность — и она не связана с подъёмом в 5 утра.
Можно подумать, что это сложная система. Нет.
За 7 дней тревога заметно спала. Я закрыл 3 проекта, которые откладывал месяцами.
Привычка: первые 30 минут без телефона. Всё.
Что ты делаешь первым делом после пробуждения? Пиши ниже 👇`,
    instruction: '',
    refining: false,
    children: [],
  },
  {
    id: 'v3',
    text: `I used to think I wasn't a morning person. Turns out — I was just doing mornings wrong.
Every day started the same: phone, notifications, anxiety. Before I'd even stood up, my brain was already in someone else's story.
The fix was embarrassingly simple. 30 minutes. No screen. Just me and what actually matters.
Three weeks later, I finish my most important work before lunch — every single day.
What would your mornings look like without the scroll?`,
    tr: `Я думал, что я просто не жаворонок. Оказалось — я просто неправильно проводил утро.
Каждый день начинался одинаково: телефон, уведомления, тревога. Ещё не встав с кровати, я уже жил в чужой истории.
Решение оказалось до неловкого простым. 30 минут. Без экрана. Только я и то, что действительно важно.
Три недели спустя — самую важную работу я закрываю до обеда, каждый день.
Как бы выглядело твоё утро без скроллинга?`,
    instruction: '',
    refining: false,
    children: [],
  },
]

const PLACEHOLDERS = [
  "Toothpaste is the cheapest and fastest way to polish headlights.",
  "They say read 100 books to get rich. I read more and didn't. Then I realised — the only book worth writing is your own.",
  "The biggest mistake in photography: putting the subject in the centre of the frame.",
  "I tried a lot of diets. All of them worked temporarily and painfully. The only thing that stuck was the insulin index diet.",
  "Less than 1% of people try to start a business. 9 out of 10 fail in year one. Of those left, 70% are gone in 10 years. Success rate: 0.3%. It's more luck than pattern.",
  "Everyone worries AI will take all jobs. But human needs are the entire foundation of any economy. The real issue is just that a lot of people will need to learn new skills.",
]

// ── Variant card (recursive — handles both top-level and refined children) ────

interface VariantCardProps {
  variant: GeneratedVariant | RefinedVariant
  showTr: boolean
  depth?: number
  onSave: (text: string) => void
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
  const [text, setText] = useState(variant.text)
  const isRefining = variant.refining

  return (
    <div className={`${depth > 0 ? 'ml-5 border-l-2 border-stone-100 pl-4' : ''}`}>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">

        {/* Text field */}
        <div className="px-5 pt-5 pb-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
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
              placeholder="Make shorter · Change hook · Translate to German · Make it punchier…"
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
            onClick={() => onSave(text)}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function NewScriptPage() {
  const navigate = useNavigate()

  // Language
  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const showTr = inputLang !== outputLang

  // Idea fields
  const [source, setSource] = useState('')
  const [ideaText, setIdeaText] = useState('')
  const [note, setNote] = useState('')

  // Idea picker modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // All variants (flat map by id for easy lookup)
  const [variants, setVariants] = useState<GeneratedVariant[]>([])

  const [placeholder] = useState(
    () => 'Sample: ' + PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )

  const filteredIdeas = mockIdeas.filter(i =>
    i.idea.toLowerCase().includes(modalSearch.toLowerCase())
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!source.trim() && !ideaText.trim()) return
    setGenerating(true)
    // TODO: real API call — for now use mock
    setTimeout(() => {
      setVariants(mockGenerated.map(v => ({ ...v })))
      setGenerating(false)
      setGenerated(true)
    }, 1400)
  }

  const handleSelectIdea = (idea: typeof mockIdeas[0]) => {
    setIdeaText(idea.idea)
    setNote(idea.note)
    setModalOpen(false)
    setModalSearch('')
  }

  // Update instruction field on any variant (top-level or nested) by id
  const updateInstruction = (id: string, value: string) => {
    setVariants(prev => updateInTree(prev, id, v => ({ ...v, instruction: value })))
  }

  // Refine a variant: simulate AI call, add child
  const handleRefine = (id: string) => {
    // Mark as refining
    setVariants(prev => updateInTree(prev, id, v => ({ ...v, refining: true })))

    setTimeout(() => {
      const childId = `${id}-r${Date.now()}`
      const child: RefinedVariant = {
        id: childId,
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
    }, 1200)
  }

  const handleDelete = (id: string) => {
    setVariants(prev => deleteFromTree(prev, id))
  }

  const handleSave = (text: string) => {
    // TODO: save to backend
    console.log('Saving:', text)
    navigate('/scripts')
  }

  // ── Tree helpers ───────────────────────────────────────────────────────────

  function getInstruction(id: string): string {
    const found = findInTree(variants, id)
    return found?.instruction ?? ''
  }

  function findInTree(nodes: (GeneratedVariant | RefinedVariant)[], id: string): (GeneratedVariant | RefinedVariant) | null {
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

        {/* Idea input */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">What's your video about?</p>
            <button onClick={() => setModalOpen(true)}
              className="text-xs text-teal-600 hover:text-teal-500 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition">
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
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Key idea</label>
              <textarea value={ideaText} onChange={e => setIdeaText(e.target.value)}
                placeholder="The core message — problem + solution or pain + advice"
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Tone, audience, anything extra…"
                rows={1}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleGenerate}
              disabled={(!source.trim() && !ideaText.trim()) || generating}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition">
              {generating ? 'Generating…' : 'Generate scripts →'}
            </button>
          </div>
        </div>

        {/* ── GENERATED VARIANTS ── */}
        {generated && (
          <div>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-stone-900 mb-1">
                3 scripts, ready to use
              </h2>
              <p className="text-xs text-stone-400">
                Edit directly, or describe what to change and hit Apply — a refined version will appear below your original.
                Save as many as you like.
              </p>
            </div>

            <div className="flex flex-col gap-6 pb-16">
              {variants.map((variant, i) => (
                <div key={variant.id}>
                  <p className="text-[10px] text-stone-300 uppercase tracking-widest mb-2 ml-1">
                    Version {i + 1}
                  </p>
                  <VariantCard
                    variant={variant}
                    showTr={showTr}
                    depth={0}
                    onSave={handleSave}
                    onInstructionChange={updateInstruction}
                    onRefine={handleRefine}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── IDEA PICKER MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
          onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-stone-900">Pick an idea</h3>
              <button onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition text-lg leading-none">×</button>
            </div>

            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input type="text" placeholder="Search ideas…" value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400" />
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {filteredIdeas.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">No ideas found</p>
              ) : filteredIdeas.map(idea => (
                <button key={idea.id}
                  onClick={() => handleSelectIdea(idea)}
                  className="text-left bg-stone-50 hover:bg-teal-50 border border-stone-200 hover:border-teal-300 rounded-xl px-4 py-3 transition">
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
