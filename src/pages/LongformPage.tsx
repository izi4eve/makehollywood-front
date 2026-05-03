import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { fetchLongforms, updateLongform, deleteLongform, type LongformResponse } from '../api/longforms'
import { LANG_FLAG } from '../data/languages'

const PREVIEW_LENGTH = 180

export default function LongformPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [longforms, setLongforms] = useState<LongformResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<LongformResponse | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!token) return
    fetchLongforms(token)
      .then(setLongforms)
      .catch(() => setError('Failed to load longform scripts.'))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return longforms
    return longforms.filter(lf =>
      (lf.title ?? '').toLowerCase().includes(q) ||
      lf.fullText.toLowerCase().includes(q)
    )
  }, [longforms, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleEdit = (lf: LongformResponse) => {
    setEditingId(lf.id)
    setEditDraft({ ...lf })
  }

  const handleSave = async () => {
    if (!editDraft || !token) return
    try {
      const updated = await updateLongform(editDraft.id, editDraft.title ?? '', editDraft.fullText, token)
      setLongforms(prev => prev.map(lf => lf.id === updated.id ? updated : lf))
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
      await deleteLongform(id, token)
      setLongforms(prev => prev.filter(lf => lf.id !== id))
      if (editingId === id) { setEditingId(null); setEditDraft(null) }
    } catch {
      setError('Failed to delete. Please try again.')
    }
  }

  const showTr = (lf: LongformResponse) => lf.inputLang !== lf.outputLang

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
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-stone-400 transition"
          />
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-24 text-stone-300 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
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
          <div className="flex flex-col gap-2">
            {paginated.map(lf => (
              <div key={lf.id}
                className="bg-white border border-stone-200 rounded-xl px-5 py-4 transition hover:border-stone-300">

                {editingId === lf.id && editDraft ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
                      <input
                        type="text"
                        value={editDraft.title ?? ''}
                        onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-wide mb-1 block">Script</label>
                      <textarea
                        value={editDraft.fullText}
                        onChange={e => setEditDraft({ ...editDraft, fullText: e.target.value })}
                        rows={12}
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
                      {lf.title && (
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                          {lf.title}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm text-stone-800 leading-relaxed">
                          {lf.fullText.replace(/\n+/g, ' ').slice(0, PREVIEW_LENGTH)}
                          {lf.fullText.length > PREVIEW_LENGTH ? '…' : ''}
                        </span>
                      </div>
                      {showTr(lf) && lf.fullTextTr && (
                        <p className="text-xs text-stone-400 leading-relaxed mt-2 italic line-clamp-2">
                          {lf.fullTextTr.replace(/\n+/g, ' ').slice(0, PREVIEW_LENGTH)}…
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-stone-300">
                          {lf.updatedAt?.slice(0, 10)}
                        </span>
                        {showTr(lf) && (
                          <span className="text-xs text-stone-300">
                            · {LANG_FLAG[lf.inputLang]} → {LANG_FLAG[lf.outputLang]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 mt-0.5">
                      <button onClick={() => handleDelete(lf.id)} title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-400 transition text-xs">
                        🗑
                      </button>
                      <button onClick={() => handleEdit(lf)} title="Edit"
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
