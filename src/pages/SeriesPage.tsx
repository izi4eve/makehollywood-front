import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

const seriesScripts = mockScripts.filter(s => s.type === 'series')

type Mode = 'list' | 'editor'

interface Episode {
  id: string
  title: string
  idea: string
  generated: boolean
}

export default function SeriesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const prefillTheme = location.state?.theme ?? ''
  const prefillAngle = location.state?.angle ?? ''
  const isNew = location.pathname === '/series/new'

  const [mode, setMode] = useState<Mode>(isNew ? 'editor' : 'list')
  const [seriesTitle, setSeriesTitle] = useState(prefillTheme)
  const [seriesIdea, setSeriesIdea] = useState(
    prefillTheme ? `${prefillTheme}${prefillAngle ? '\n\nУгол: ' + prefillAngle : ''}` : ''
  )
  const [inputLang, setInputLang] = useState('ru')
  const [outputLang, setOutputLang] = useState('en')
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [extracting, setExtracting] = useState(false)

  const handleExtractEpisodes = () => {
    if (!seriesIdea.trim()) return
    setExtracting(true)
    // TODO: AI API call
    setTimeout(() => {
      setExtracting(false)
      setEpisodes([
        { id: 'e1', title: 'Введение: что такое Deep Work', idea: 'Определение, почему это важно сейчас', generated: false },
        { id: 'e2', title: 'Правило №1: Работай глубоко', idea: 'Ритуалы, блокировка времени, среда', generated: false },
        { id: 'e3', title: 'Правило №2: Прими скуку', idea: 'Как тренировать концентрацию через скуку', generated: false },
        { id: 'e4', title: 'Правило №3: Брось соцсети', idea: 'Инструменты внимания vs инструменты отвлечения', generated: false },
        { id: 'e5', title: 'Правило №4: Опустоши мелкое', idea: 'Батчинг, делегирование, защита глубокого времени', generated: false },
      ])
    }, 1400)
  }

  if (mode === 'list') {
    return (
      <Layout breadcrumbs={[{ label: 'Series' }]}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Series</h1>
            <p className="text-stone-400 text-sm">
              Длинные видео и серии шортсов. Одна большая идея — разбитая на главы.
            </p>
          </div>
          <button
            onClick={() => { setMode('editor'); setSeriesIdea(''); setEpisodes([]) }}
            className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Series
          </button>
        </div>

        {seriesScripts.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-lg mb-2">Нет ни одной серии</p>
            <p className="text-sm">Создай первую — опиши большую идею, ИИ разобьёт на эпизоды</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seriesScripts.map(script => (
              <div key={script.id} onClick={() => setMode('editor')}>
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
    <Layout breadcrumbs={[{ label: 'Series', to: '/series' }, { label: seriesTitle || 'New Series' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex gap-2">
            {['Script', 'Voice', 'Video'].map((tab, i) => (
              <span key={tab}
                onClick={() => { if (tab === 'Voice') navigate('/voice'); if (tab === 'Video') navigate('/video') }}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                  i === 0 ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                }`}>
                {tab}
              </span>
            ))}
          </div>
          <span className="text-xs text-stone-400 ml-auto">🎬 Series</span>
        </div>

        {/* Language */}
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

        {/* Series idea */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Большая идея серии
          </label>
          <input
            type="text"
            placeholder="Название серии"
            value={seriesTitle}
            onChange={e => setSeriesTitle(e.target.value)}
            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition placeholder-stone-400 mb-3"
          />
          <textarea
            value={seriesIdea} onChange={e => setSeriesIdea(e.target.value)}
            placeholder="Опиши всю идею целиком. Что хочешь рассказать? Из каких частей это состоит? ИИ сам разобьёт на логичные эпизоды."
            rows={5}
            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
          />
        </div>

        <button onClick={handleExtractEpisodes} disabled={!seriesIdea.trim() || extracting}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition mb-10">
          {extracting ? 'Разбиваю на эпизоды…' : 'Разбить на эпизоды →'}
        </button>

        {/* Episodes list */}
        {episodes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">
                Эпизоды ({episodes.length})
              </h2>
              <p className="text-xs text-stone-400">Нажми на эпизод, чтобы написать текст</p>
            </div>
            <div className="flex flex-col gap-3">
              {episodes.map((ep, i) => (
                <div key={ep.id}
                  className="border border-stone-200 bg-white rounded-xl p-4 cursor-pointer hover:border-teal-400 transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-stone-300 font-medium w-6 shrink-0 mt-0.5">{i + 1}.</span>
                      <div>
                        <p className="text-stone-900 font-medium text-sm group-hover:text-teal-700 transition">{ep.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{ep.idea}</p>
                      </div>
                    </div>
                    <span className={`text-xs shrink-0 ${ep.generated ? 'text-teal-500' : 'text-stone-300'}`}>
                      {ep.generated ? '✓ Готово' : 'Не написан'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => navigate('/voice')}
                className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition">
                Перейти к озвучке → Voice
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
