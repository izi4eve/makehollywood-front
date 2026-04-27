import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

interface Script {
  id: string
  inputLang: string
  outputLang: string
  fullText: string        // final assembled text in output language
  fullTextTr?: string     // translation back to input language
  createdAt: string
  updatedAt: string
}

const langFlag: Record<string, string> = {
  en: '🇬🇧', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', uk: '🇺🇦',
}

const mockScripts: Script[] = [
  {
    id: 'sc1',
    inputLang: 'ru',
    outputLang: 'en',
    fullText: `Most people waste their best hours without even knowing it.

Because the moment you check your phone in the morning, your brain locks into reactive mode — responding to everyone else's agenda instead of your own.

I tracked my focus for 14 days. On days I skipped the morning scroll, I finished 2x more deep work before noon.

Stop checking your phone for the first 30 minutes after waking up. That window is yours — protect it.

Does this sound too simple to work? Try it tomorrow and tell me.`,
    fullTextTr: `Большинство людей тратят лучшие часы впустую, даже не осознавая этого.

Потому что в момент, когда ты берёшь телефон утром, мозг переходит в реактивный режим — ты реагируешь на чужую повестку, а не свою.

Я отслеживал фокус 14 дней. В дни без утреннего скроллинга я делал в 2 раза больше глубокой работы до полудня.

Не трогай телефон первые 30 минут после пробуждения. Это окно — твоё. Защищай его.

Звучит слишком просто? Попробуй завтра и напиши мне.`,
    createdAt: '2026-04-11',
    updatedAt: '2026-04-11',
  },
  {
    id: 'sc2',
    inputLang: 'ru',
    outputLang: 'en',
    fullText: `This one habit doubled my output — and it has nothing to do with waking up at 5am.

You'd think it's some complex system. It's not.

In 7 days of tracking, my anxiety dropped noticeably and I finished 3 projects I'd been avoiding for months.

The habit: no phone for the first 30 minutes of the day. That's it.

What's your morning ritual? Drop it below 👇`,
    fullTextTr: `Эта одна привычка удвоила мою продуктивность — и она не связана с подъёмом в 5 утра.

Можно подумать, что это сложная система. Нет.

За 7 дней наблюдений тревога заметно спала, и я закрыл 3 проекта, которые откладывал месяцами.

Привычка: первые 30 минут без телефона. Всё.

Какой у тебя утренний ритуал? Пиши ниже 👇`,
    createdAt: '2026-04-12',
    updatedAt: '2026-04-13',
  },
]

export default function ScriptsPage() {
  const navigate = useNavigate()
  const [scripts, setScripts] = useState<Script[]>(mockScripts)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return scripts
    return scripts.filter(s => s.fullText.toLowerCase().includes(q))
  }, [scripts, search])

  const handleDelete = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id))
  }

  return (
    <Layout breadcrumbs={[{ label: 'Scripts' }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Scripts</h1>
          <p className="text-stone-400 text-sm">
            AI-powered scripts for your short-form videos. Hook → Body → CTA.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" placeholder="Search scripts…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            {search
              ? <p className="text-sm">No scripts match "{search}"</p>
              : <>
                  <p className="text-lg mb-2">No scripts yet</p>
                  <p className="text-sm">Hit "+ New Script" to write your first one.</p>
                </>
            }
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(script => (
              <div key={script.id}
                className="bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-300 transition">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Full script text */}
                    <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                      {script.fullText}
                    </p>
                    {/* Translation */}
                    {script.inputLang !== script.outputLang && script.fullTextTr && (
                      <p className="text-xs text-stone-400 leading-relaxed whitespace-pre-line mt-3 italic">
                        {script.fullTextTr}
                      </p>
                    )}
                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-stone-300">
                        {script.updatedAt}
                      </span>
                      {script.inputLang !== script.outputLang && (
                        <span className="text-xs text-stone-300">
                          · {langFlag[script.inputLang]} → {langFlag[script.outputLang]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/scripts/${script.id}`)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-600 text-stone-400 transition text-xs"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(script.id)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
