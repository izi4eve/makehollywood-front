import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fetchScripts, updateScript, deleteScript, type ScriptResponse } from '../api/scripts'
import { LANG_FLAG } from '../data/languages'

export default function ScriptsPage() {
  const { token } = useAuth()

  const [scripts, setScripts] = useState<ScriptResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ScriptResponse | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!token) return
    fetchScripts(token)
      .then(setScripts)
      .catch(() => setError('Failed to load scripts.'))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return scripts
    return scripts.filter(s =>
      (s.name ?? '').toLowerCase().includes(q) ||
      s.fullText.toLowerCase().includes(q)
    )
  }, [scripts, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleEdit = (script: ScriptResponse) => {
    setEditingId(script.id)
    setEditDraft({ ...script })
  }

  const handleSave = async () => {
    if (!editDraft || !token) return
    try {
      const updated = await updateScript(editDraft.id, editDraft.name ?? '', editDraft.fullText, token)
      setScripts(prev => prev.map(s => s.id === updated.id ? updated : s))
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
      await deleteScript(id, token)
      setScripts(prev => prev.filter(s => s.id !== id))
      if (editingId === id) { setEditingId(null); setEditDraft(null) }
    } catch {
      setError('Failed to delete. Please try again.')
    }
  }

  const showTr = (s: ScriptResponse) => s.inputLang !== s.outputLang

  return (
    <Layout breadcrumbs={[{ label: 'Scripts' }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Scripts</h1>
          <p className="text-stone-400 text-sm">
            AI-powered scripts for your short-form videos. Hook → Bridge → Value → CTA.
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
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition" />
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-24 text-stone-300 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
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
          <div className="flex flex-col gap-2">
            {paginated.map(script => (
              <div key={script.id}
                className="bg-white border border-stone-200 rounded-xl px-5 py-4 transition hover:border-stone-300">

                {editingId === script.id && editDraft ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Name</label>
                      <input
                        type="text"
                        value={editDraft.name ?? ''}
                        onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Script</label>
                      <textarea
                        value={editDraft.fullText}
                        onChange={e => setEditDraft({ ...editDraft, fullText: e.target.value })}
                        rows={8}
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
                      {script.name && (
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                          {script.name}
                        </p>
                      )}
                      <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                        {script.fullText}
                      </p>
                      {showTr(script) && script.fullTextTr && (
                        <p className="text-xs text-stone-400 leading-relaxed whitespace-pre-line mt-3 italic">
                          {script.fullTextTr}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-stone-300">
                          {script.updatedAt?.slice(0, 10)}
                        </span>
                        {showTr(script) && (
                          <span className="text-xs text-stone-300">
                            · {LANG_FLAG[script.inputLang]} → {LANG_FLAG[script.outputLang]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 mt-0.5">
                      <button onClick={() => handleDelete(script.id)} title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs">
                        🗑
                      </button>
                      <button onClick={() => handleEdit(script)} title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-600 text-stone-400 transition text-xs">
                        ✏️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
              ← Prev
            </button>
            <span className="text-xs text-stone-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition disabled:opacity-30">
              Next →
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
