import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ScriptCard from '../components/ScriptCard'
import { mockScripts } from '../data/mockScripts'

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'uk', label: '🇺🇦 Українська' },
]

const mockVariants = [
  {
    id: 1,
    hook: 'Most people waste their mornings doing this one thing.',
    hookTr: 'Большинство людей тратят утро впустую, делая одну вещь.',
    body: "You wake up, grab your phone, and suddenly 40 minutes are gone. Here's what high performers do instead: protect the first hour. No notifications — just one focused task.",
    bodyTr: 'Просыпаешься, берёшь телефон — и 40 минут как не бывало. Успешные люди делают иначе: защищают первый час. Без уведомлений — только одна задача.',
    cta: 'Try this tomorrow and tell me what changed.',
    ctaTr: 'Попробуй завтра и напиши, что изменилось.',
  },
  {
    id: 2,
    hook: 'Your morning routine is silently killing your productivity.',
    hookTr: 'Твоё утро незаметно убивает твою продуктивность.',
    body: "The problem isn't discipline — it's design. When you check messages first thing, your brain enters reactive mode for the rest of the day.",
    bodyTr: 'Проблема не в дисциплине — в дизайне. Когда с утра проверяешь сообщения, мозг переходит в реактивный режим на весь день.',
    cta: 'Save this and share with someone who needs a reset.',
    ctaTr: 'Сохрани и отправь тому, кому нужна перезагрузка.',
  },
  {
    id: 3,
    hook: 'I changed one thing in my morning and doubled my output.',
    hookTr: 'Я изменил одну вещь в утре — и удвоил результат.',
    body: "It sounds too simple: I stopped checking my phone for the first 30 minutes. Within a week my anxiety dropped and I was finishing projects I'd postponed for months.",
    bodyTr: 'Звучит слишком просто: перестал трогать телефон первые 30 минут. За неделю тревога спала, начал заканчивать задачи, которые откладывал месяцами.',
    cta: 'Follow for more no-nonsense productivity tips.',
    ctaTr: 'Подпишись — без воды про продуктивность.',
  },
]

const shortsScripts = mockScripts.filter(s => s.type === 'shorts')

type Mode = 'list' | 'editor'

export default function ShortsPage() {
  const location = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()

  const prefillTheme = location.state?.theme ?? ''
  const prefillAngle = location.state?.angle ?? ''
  const isNew = location.pathname === '/shorts/new'
  const existingScript = id ? shortsScripts.find(s => s.id === id) : null

  const [mode, setMode] = useState<Mode>(isNew || existingScript ? 'editor' : 'list')
  const [idea, setIdea] = useState(
    existingScript
      ? `${existingScript.title}${existingScript.description ? '\n\n' + existingScript.description : ''}`
      : prefillTheme
      ? `${prefillTheme}${prefillAngle ? '\n\nУгол: ' + prefillAngle : ''}`
      : ''
  )
  const [inputLang, setInputLang] = useState(existingScript?.inputLang ?? 'ru')
  const [outputLang, setOutputLang] = useState(existingScript?.outputLang ?? 'en')
  const [seriesEnabled, setSeriesEnabled] = useState(!!existingScript?.seriesName)
  const [seriesName, setSeriesName] = useState(existingScript?.seriesName ?? '')
  const [seriesPart, setSeriesPart] = useState(String(existingScript?.seriesPart ?? '1'))
  const [seriesTotal, setSeriesTotal] = useState(String(existingScript?.seriesTotal ?? '5'))
  const [generated, setGenerated] = useState(!!existingScript?.selectedHook)
  const [selected, setSelected] = useState<number | null>(existingScript?.selectedHook ? 1 : null)
  const showTranslation = inputLang !== outputLang

  const handleGenerate = () => {
    if (!idea.trim()) return
    setGenerated(true)
    setSelected(null)
  }

  if (mode === 'list') {
    return (
      <Layout breadcrumbs={[{ label: 'Shorts' }]}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Shorts</h1>
            <p className="text-stone-400 text-sm">
              Короткие вертикальные видео. Hook → мясо → CTA.
            </p>
          </div>
          <button
            onClick={() => { setMode('editor'); setIdea(''); setGenerated(false); setSelected(null) }}
            className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Short
          </button>
        </div>

        {shortsScripts.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-lg mb-2">Нет ни одного шортса</p>
            <p className="text-sm">Создай первый — займёт пару минут</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shortsScripts.map(script => (
              <div key={script.id} onClick={() => { setMode('editor') }}>
                <ScriptCard script={script} />
              </div>
            ))}
          </div>
        )}
      </Layout>
    )
  }

  // Editor mode
  return (
    <Layout breadcrumbs={[{ label: 'Shorts', to: '/shorts' }, { label: existingScript?.title ?? 'New Short' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex gap-2">
            {['Script', 'Voice', 'Video'].map((tab, i) => (
              <span
                key={tab}
                onClick={() => {
                  if (tab === 'Voice') navigate('/voice')
                  if (tab === 'Video') navigate('/video')
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                  i === 0 ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <span className="text-xs text-stone-400 ml-auto">⚡ Shorts</span>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3 mb-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <span className="text-xs text-stone-500 font-medium shrink-0">Язык:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">Ввод</label>
            <select value={inputLang} onChange={e => setInputLang(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className="text-stone-300 text-sm">→</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">Результат</label>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <span className={`text-xs ml-auto italic ${inputLang !== outputLang ? 'text-teal-500' : 'text-stone-400'}`}>
            {inputLang !== outputLang ? 'Перевод включён' : 'Без перевода'}
          </span>
        </div>

        {/* Series toggle */}
        <div className="mb-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSeriesEnabled(v => !v)}
              className="relative shrink-0"
              style={{ width: 32, height: 18 }}
            >
              <div className={`absolute inset-0 rounded-full transition ${seriesEnabled ? 'bg-teal-500' : 'bg-stone-300'}`} />
              <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${seriesEnabled ? 'left-[14px]' : 'left-0.5'}`} />
            </button>
            <span className="text-xs font-medium text-stone-700">Часть серии</span>
          </div>
          {seriesEnabled && (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <input type="text" placeholder="Название серии"
                value={seriesName} onChange={e => setSeriesName(e.target.value)}
                className="flex-1 min-w-[160px] bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400">Часть</span>
                <input type="number" value={seriesPart} onChange={e => setSeriesPart(e.target.value)} min={1}
                  className="w-12 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:ring-2 focus:ring-teal-500" />
                <span className="text-xs text-stone-400">из</span>
                <input type="number" value={seriesTotal} onChange={e => setSeriesTotal(e.target.value)} min={1}
                  className="w-12 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}
        </div>

        {/* Idea input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-stone-700 mb-2">О чём видео?</label>
          <textarea
            value={idea} onChange={e => setIdea(e.target.value)}
            placeholder="Опиши идею, главный месседж, для кого это. Чем больше контекста — тем лучше результат."
            rows={4}
            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
          />
        </div>

        <button onClick={handleGenerate} disabled={!idea.trim()}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition mb-10">
          Сгенерировать 3 варианта →
        </button>

        {/* Variants */}
        {generated && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Выбери вариант</h2>
            <div className="flex flex-col gap-4">
              {mockVariants.map(v => (
                <div key={v.id} onClick={() => setSelected(v.id)}
                  className={`border rounded-xl p-5 cursor-pointer transition ${
                    selected === v.id ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">Hook</p>
                  <p className="text-stone-900 font-medium mb-1">{v.hook}</p>
                  {showTranslation && <p className="text-xs text-stone-400 mb-3 italic">{v.hookTr}</p>}
                  {!showTranslation && <div className="mb-3" />}

                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">Body</p>
                  <p className="text-stone-600 text-sm mb-1">{v.body}</p>
                  {showTranslation && <p className="text-xs text-stone-400 mb-3 italic">{v.bodyTr}</p>}
                  {!showTranslation && <div className="mb-3" />}

                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">CTA</p>
                  <p className="text-stone-600 text-sm mb-1">{v.cta}</p>
                  {showTranslation && <p className="text-xs text-stone-400 italic">{v.ctaTr}</p>}
                </div>
              ))}
            </div>

            {selected && (
              <div className="mt-6 flex justify-end">
                <button onClick={() => navigate('/voice')}
                  className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition">
                  Использовать → Voice
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
