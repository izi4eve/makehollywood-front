import { useState, useMemo } from 'react'
import Layout from '../components/Layout'

interface Idea {
  id: string
  source: string
  idea: string        // in output language
  ideaTr?: string     // translation back to input language
  note: string
  inputLang: string
  outputLang: string
  createdAt: string
}

const mockIdeas: Idea[] = [
  {
    id: 'i1',
    source: 'Люди тратят утро впустую. Телефон, соцсети, новости. А потом весь день в реактивном режиме.',
    idea: 'If you avoid notifications and news first thing in the morning, you stay productive for much longer.',
    ideaTr: 'Если не смотреть уведомления и новости с самого утра, остаёшься продуктивным значительно дольше.',
    note: 'Could work as part of a morning routine series.',
    inputLang: 'ru',
    outputLang: 'en',
    createdAt: '2026-04-10',
  },
  {
    id: 'i2',
    source: 'Когда проверяешь сообщения с утра, мозг переходит в реактивный режим на весь день.',
    idea: 'Checking messages first thing puts your brain in reactive mode — and it never fully recovers that day.',
    ideaTr: 'Проверка сообщений с утра переключает мозг в реактивный режим — и он так и не восстанавливается за день.',
    note: '',
    inputLang: 'ru',
    outputLang: 'en',
    createdAt: '2026-04-11',
  },
  {
    id: 'i3',
    source: 'Перестал трогать телефон первые 30 минут. За неделю тревога спала, начал заканчивать задачи.',
    idea: 'Just 30 minutes without your phone in the morning can drop anxiety and close tasks you\'ve been avoiding for months.',
    ideaTr: 'Всего 30 минут без телефона утром снижают тревогу и помогают закрыть задачи, которые откладывались месяцами.',
    note: 'Personal story angle — feels authentic.',
    inputLang: 'ru',
    outputLang: 'en',
    createdAt: '2026-04-12',
  },
]

const langFlag: Record<string, string> = {
  en: '🇬🇧', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', uk: '🇺🇦',
}

export default function IdeasPage() {
  const [ideas, setIdeas]         = useState<Idea[]>(mockIdeas)
  const [search, setSearch]       = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Idea | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return ideas
    return ideas.filter(i =>
      i.idea.toLowerCase().includes(q) ||
      i.note.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q)
    )
  }, [ideas, search])

  const handleEdit = (idea: Idea) => {
    setEditingId(idea.id)
    setEditDraft({ ...idea })
  }

  const handleSave = () => {
    if (!editDraft) return
    setIdeas(prev => prev.map(i => i.id === editDraft.id ? editDraft : i))
    setEditingId(null)
    setEditDraft(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const handleDelete = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id))
    if (editingId === id) { setEditingId(null); setEditDraft(null) }
  }

  return (
    <Layout breadcrumbs={[{ label: 'Ideas' }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Ideas</h1>
          <p className="text-stone-400 text-sm">
            Your saved ideas. Go to Scripts to turn them into short-form video scripts.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" placeholder="Search ideas…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            {search
              ? <p className="text-sm">No ideas match "{search}"</p>
              : <>
                  <p className="text-lg mb-2">No ideas yet</p>
                  <p className="text-sm">Hit "+ New Idea" in the menu and dump your thoughts.</p>
                </>
            }
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(idea => {
              const showTr = idea.inputLang !== idea.outputLang

              return (
                <div key={idea.id}
                  className="bg-white border border-stone-200 rounded-xl px-5 py-4 transition hover:border-stone-300">

                  {editingId === idea.id && editDraft ? (
                    /* Edit mode */
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Source</label>
                        <textarea value={editDraft.source}
                          onChange={e => setEditDraft({ ...editDraft, source: e.target.value })}
                          rows={2}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                      </div>
                      <div>
                        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Idea</label>
                        <textarea value={editDraft.idea}
                          onChange={e => setEditDraft({ ...editDraft, idea: e.target.value })}
                          rows={2}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                      </div>
                      <div>
                        <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Note</label>
                        <textarea value={editDraft.note}
                          onChange={e => setEditDraft({ ...editDraft, note: e.target.value })}
                          rows={1}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={handleCancel}
                          className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg border border-stone-200 transition">
                          Cancel
                        </button>
                        <button onClick={handleSave}
                          className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-800 leading-relaxed">{idea.idea}</p>
                        {showTr && idea.ideaTr && (
                          <p className="text-xs text-stone-400 italic mt-1.5 leading-relaxed">{idea.ideaTr}</p>
                        )}
                        {/* Language badge — only if translated */}
                        {showTr && (
                          <p className="text-xs text-stone-300 mt-2">
                            {langFlag[idea.inputLang]} → {langFlag[idea.outputLang]}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 mt-0.5">
                        <button onClick={() => handleDelete(idea.id)} title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs">
                          🗑
                        </button>
                        <button onClick={() => handleEdit(idea)} title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-600 text-stone-400 transition text-xs">
                          ✏️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
