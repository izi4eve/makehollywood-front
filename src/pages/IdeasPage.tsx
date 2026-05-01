import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fetchIdeas, updateIdea, deleteIdea, markIdeaUsed, type IdeaResponse } from '../api/ideas'
import { LANG_FLAG } from '../data/languages'

export default function IdeasPage() {
  const { token } = useAuth()

  const [ideas, setIdeas] = useState<IdeaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showUsed, setShowUsed] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<IdeaResponse | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!token) return
    fetchIdeas(token)
      .then(setIdeas)
      .catch(() => setError('Failed to load ideas.'))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    // showUsed shows ONLY used ideas; default shows only unused
    let list = showUsed ? ideas.filter(i => i.used) : ideas.filter(i => !i.used)
    if (q) list = list.filter(i =>
      i.idea.toLowerCase().includes(q) || i.source.toLowerCase().includes(q)
    )
    return list
  }, [ideas, search, showUsed])

  const usedCount = useMemo(() => ideas.filter(i => i.used).length, [ideas])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleEdit = (idea: IdeaResponse) => {
    setEditingId(idea.id)
    setEditDraft({ ...idea })
  }

  const handleSave = async () => {
    if (!editDraft || !token) return
    try {
      const updated = await updateIdea(editDraft.id, editDraft.source, editDraft.idea, token)
      setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i))
      setEditingId(null)
      setEditDraft(null)
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const handleDelete = async (id: number) => {
    if (!token) return
    try {
      await deleteIdea(id, token)
      setIdeas(prev => prev.filter(i => i.id !== id))
      if (editingId === id) { setEditingId(null); setEditDraft(null) }
    } catch {
      setError('Failed to delete. Please try again.')
    }
  }

  const handleToggleUsed = async (idea: IdeaResponse) => {
    if (!token) return
    try {
      const updated = await markIdeaUsed(idea.id, !idea.used, token)
      setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i))
    } catch {
      setError('Failed to update. Please try again.')
    }
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

        {/* Search + filter */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input type="text" placeholder="Search ideas…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
          </div>
          {usedCount > 0 && (
            <button
              onClick={() => { setShowUsed(p => !p); setPage(1) }}
              className={`text-xs font-medium px-3 py-2 rounded-lg border transition whitespace-nowrap ${
                showUsed
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100'
              }`}
            >
              {showUsed ? '← All ideas' : `Show used (${usedCount})`}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-4">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-24 text-stone-300 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            {search
              ? <p className="text-sm">No ideas match "{search}"</p>
              : showUsed
              ? <p className="text-sm">No used ideas yet.</p>
              : <>
                <p className="text-lg mb-2">No ideas yet</p>
                <p className="text-sm">Hit "+ New Idea" in the menu and dump your thoughts.</p>
              </>
            }
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {paginated.map(idea => {
              const showTr = idea.inputLang !== idea.outputLang
              return (
                <div key={idea.id}
                  className={`bg-white border rounded-xl px-5 py-4 transition hover:border-stone-300 ${
                    idea.used ? 'border-stone-100 opacity-50' : 'border-stone-200'
                  }`}>

                  {editingId === idea.id && editDraft ? (
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
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-800 leading-relaxed">{idea.idea}</p>
                        {showTr && idea.ideaTr && (
                          <p className="text-xs text-stone-400 italic mt-1.5 leading-relaxed">{idea.ideaTr}</p>
                        )}
                        {showTr && (
                          <p className="text-xs text-stone-300 mt-2">
                            {LANG_FLAG[idea.inputLang]} → {LANG_FLAG[idea.outputLang]}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 mt-0.5">
                        <button
                          onClick={() => handleToggleUsed(idea)}
                          title={idea.used ? 'Mark as unused' : 'Mark as used'}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition text-xs ${
                            idea.used
                              ? 'bg-teal-100 text-teal-600 hover:bg-stone-100 hover:text-stone-400'
                              : 'bg-stone-100 text-stone-300 hover:bg-teal-50 hover:text-teal-500'
                          }`}
                        >
                          ✓
                        </button>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-xs text-stone-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
