import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'uk', label: '🇺🇦 Українська' },
]

interface ExtractedIdea {
  id: string
  text: string      // in output language
  tr: string        // translation back to input language
  flash: boolean
}

const mockExtracted: ExtractedIdea[] = [
  {
    id: 'e1',
    text: 'If you avoid notifications and news first thing in the morning, you stay productive for much longer.',
    tr: 'Если не смотреть уведомления и новости с самого утра, остаёшься продуктивным значительно дольше.',
    flash: false,
  },
  {
    id: 'e2',
    text: 'Checking messages first thing puts your brain in reactive mode — and it never fully recovers that day.',
    tr: 'Проверка сообщений с утра переключает мозг в реактивный режим — и он так и не восстанавливается за день.',
    flash: false,
  },
  {
    id: 'e3',
    text: 'Just 30 minutes without your phone in the morning can drop anxiety and close tasks you\'ve been avoiding for months.',
    tr: 'Всего 30 минут без телефона утром снижают тревогу и помогают закрыть задачи, которые откладывались месяцами.',
    flash: false,
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

export default function NewIdeaPage() {
  const navigate = useNavigate()

  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const showTr = inputLang !== outputLang

  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedIdea[]>([])
  const [savedCount, setSavedCount] = useState(0)

  const [placeholder] = useState(
    () => 'Sample: ' + PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )

  const handleExtract = () => {
    if (!rawText.trim()) return
    setExtracting(true)
    setTimeout(() => {
      setExtracting(false)
      setExtracted(mockExtracted.map(e => ({ ...e, flash: false })))
      setSavedCount(0)
    }, 1200)
  }

  const triggerRemove = (id: string, type: 'add' | 'delete') => {
    setExtracted(prev => prev.map(e => e.id === id ? { ...e, flash: true } : e))
    setTimeout(() => {
      setExtracted(prev => prev.filter(e => e.id !== id))
      if (type === 'add') setSavedCount(c => c + 1)
    }, 350)
  }

  const visible = extracted.filter(e => !e.flash)
  const allDone = extracted.length > 0 && visible.length === 0

  return (
    <Layout breadcrumbs={[{ label: 'Ideas', to: '/ideas' }, { label: 'New Idea' }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">New Idea</h1>
          <p className="text-stone-400 text-sm">
            What useful thing do you want to tell your viewer? Your experience, mistakes, observations, solutions. Top tips, secrets, facts, research, what's new. Spotted a lie or disagree with something everyone accepts?
          </p>
          <p className="text-stone-300 text-sm mt-1">
            No structure needed — just dump it. AI will pull out the angles.
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

        {/* Raw input */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Description *</label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            // placeholder="Just dump your thoughts here…"
            placeholder={placeholder}
            rows={5}
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleExtract}
              disabled={!rawText.trim() || extracting}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {extracting ? 'Extracting…' : 'Extract ideas →'}
            </button>
          </div>
        </div>

        {/* Extracted ideas */}
        {extracted.length > 0 && !allDone && (
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-2 px-1">
              Possible ideas — keep what's worth it
            </p>
            <div className="flex flex-col gap-2">
              {extracted.map(idea => (
                <div
                  key={idea.id}
                  className={`bg-white border rounded-xl px-5 py-4 flex items-start gap-4 transition-all duration-300 ${idea.flash
                    ? 'border-green-300 bg-green-50 opacity-0 scale-95'
                    : 'border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 leading-relaxed">{idea.text}</p>
                    {showTr && (
                      <p className="text-xs text-stone-400 italic mt-1.5 leading-relaxed">{idea.tr}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0 mt-0.5">
                    <button
                      onClick={() => triggerRemove(idea.id, 'delete')}
                      title="Discard"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs"
                    >
                      🗑
                    </button>
                    <button
                      onClick={() => triggerRemove(idea.id, 'add')}
                      title="Add to Ideas"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All processed */}
        {allDone && (
          <div className="text-center py-10 text-stone-400 text-sm">
            {savedCount > 0
              ? <p className="mb-3">{savedCount} idea{savedCount > 1 ? 's' : ''} saved.</p>
              : <p className="mb-3">All cleared.</p>
            }
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setExtracted([]); setRawText('') }}
                className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition"
              >
                Extract more
              </button>
              <button
                onClick={() => navigate('/ideas')}
                className="text-xs text-teal-600 hover:text-teal-500 border border-teal-200 px-3 py-1.5 rounded-lg transition"
              >
                Go to Ideas →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
