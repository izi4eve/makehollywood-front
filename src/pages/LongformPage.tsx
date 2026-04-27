import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

interface Longform {
  id: string
  title: string
  inputLang: string
  outputLang: string
  fullText: string
  fullTextTr?: string
  createdAt: string
  updatedAt: string
}

const langFlag: Record<string, string> = {
  en: '🇬🇧', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', uk: '🇺🇦',
}

const PREVIEW_LENGTH = 180

const mockLongforms: Longform[] = [
  {
    id: 'lf1',
    inputLang: 'ru',
    outputLang: 'en',
    title: 'Why I Quit My Corporate Job to Start a YouTube Channel',
    fullText: `Five years ago I was sitting in a glass-walled meeting room on the 14th floor, nodding along to a slide deck I'd seen fifteen variations of, and I remember thinking: if I have to sit through one more quarterly review that changes absolutely nothing, I'm going to lose my mind.

That thought didn't go away. It sat in the back of my head for another eight months while I kept showing up, kept doing the work, kept telling myself that the stability was worth it.

It wasn't.

The day I handed in my resignation letter was the most terrifying and most alive I'd felt in years. I had no guarantee of income. I had a half-built YouTube channel with 340 subscribers and a camera I'd bought on impulse during a Black Friday sale.

What I did have was a very clear problem I wanted to solve — for myself first, and then for anyone willing to listen.`,
    fullTextTr: `Пять лет назад я сидел в переговорке со стеклянными стенами на 14-м этаже, согласно кивал очередной презентации — и вдруг поймал себя на мысли: если мне придётся пережить ещё один квартальный обзор, который ни к чему не приводит, я сойду с ума.

Эта мысль не исчезла. Она жила в голове ещё восемь месяцев, пока я продолжал ходить на работу, делать своё дело и убеждать себя, что стабильность того стоит.

Не стоила.

В день, когда я подал заявление об уходе, я чувствовал одновременно ужас и небывалую живость — такого со мной не было давно. Никаких гарантий дохода. Полуготовый YouTube-канал с 340 подписчиками и камера, купленная в порыве на чёрную пятницу.

Зато была одна вещь — очень чёткая проблема, которую я хотел решить. Сначала для себя. Потом — для всех, кто захочет слушать.`,
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10',
  },
  {
    id: 'lf2',
    inputLang: 'ru',
    outputLang: 'en',
    title: 'The Productivity Trap Nobody Talks About',
    fullText: `There's a version of productivity culture that looks extremely healthy on the surface: early mornings, structured routines, todo lists, time-blocking, deep work sessions, no-phone policies before 9am.

I lived that version for two years. I optimised everything I could optimise. I read the books. I built the systems. I hit my targets consistently.

And I burned out completely.

Not in a dramatic way. In the quiet, creeping way where you wake up one morning and realise you've been going through the motions for so long that you can't remember what you actually care about anymore.

The trap isn't laziness. The trap is optimising for the wrong thing — and doing it with extraordinary discipline.`,
    createdAt: '2026-04-14',
    updatedAt: '2026-04-15',
  },
]

export default function LongformPage() {
  const navigate = useNavigate()
  const [longforms, setLongforms] = useState<Longform[]>(mockLongforms)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return longforms
    return longforms.filter(lf =>
      lf.title.toLowerCase().includes(q) || lf.fullText.toLowerCase().includes(q)
    )
  }, [longforms, search])

  const handleDelete = (id: string) => {
    setLongforms(prev => prev.filter(lf => lf.id !== id))
  }

  return (
    <Layout breadcrumbs={[{ label: 'Longform' }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Longform</h1>
          <p className="text-stone-400 text-sm">
            AI-assisted scripts for long-form YouTube videos. Develop your story, structure your argument, and write with depth.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search scripts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            {search
              ? <p className="text-sm">No scripts match "{search}"</p>
              : <>
                  <p className="text-lg mb-2">No longform scripts yet</p>
                  <p className="text-sm">Hit "+ New Longform" to write your first one.</p>
                </>
            }
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(lf => (
              <div
                key={lf.id}
                className="bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-300 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + preview in one line */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-900 shrink-0">
                        {lf.title}
                      </span>
                      <span className="text-stone-300 text-xs shrink-0">—</span>
                      <span className="text-sm text-stone-500 truncate">
                        {lf.fullText.replace(/\n+/g, ' ').slice(0, PREVIEW_LENGTH)}
                        {lf.fullText.length > PREVIEW_LENGTH ? '…' : ''}
                      </span>
                    </div>

                    {/* Translation preview */}
                    {lf.inputLang !== lf.outputLang && lf.fullTextTr && (
                      <p className="text-xs text-stone-400 leading-relaxed mt-2 italic line-clamp-2">
                        {lf.fullTextTr.replace(/\n+/g, ' ').slice(0, PREVIEW_LENGTH)}…
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-stone-300">{lf.updatedAt}</span>
                      {lf.inputLang !== lf.outputLang && (
                        <span className="text-xs text-stone-300">
                          · {langFlag[lf.inputLang]} → {langFlag[lf.outputLang]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/longform/${lf.id}`)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-600 text-stone-400 transition text-xs"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(lf.id)}
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
