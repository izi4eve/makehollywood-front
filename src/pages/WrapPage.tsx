import { useState } from 'react'
import Layout from '../components/Layout'
import { mockScripts } from '../data/mockScripts'

interface Publication {
  id: string
  scriptId: string
  scriptTitle: string
  seoTitle: string
  seoDescription: string
  hashtags: string[]
  createdAt: string
  links: {
    youtube?: string
    tiktok?: string
    instagram?: string
  }
  views: {
    youtube?: number
    tiktok?: number
    instagram?: number
  }
  notes: string
}

const mockPublications: Publication[] = [
  {
    id: 'pub1',
    scriptId: 's1',
    scriptTitle: 'Утро без телефона',
    seoTitle: 'Stop Checking Your Phone in the Morning (Do This Instead)',
    seoDescription: 'Most people lose their best hours to mindless scrolling. In this video I share the one morning habit that doubled my focus and cut my anxiety in half — no willpower required.',
    hashtags: ['productivity', 'morningroutine', 'focustips', 'digitalwellness', 'selfimprovement'],
    createdAt: '2026-04-11',
    links: {
      youtube: 'https://youtube.com/watch?v=abc123',
      tiktok: '',
      instagram: '',
    },
    views: {
      youtube: 14200,
      tiktok: undefined,
      instagram: undefined,
    },
    notes: 'Лучший перформанс за месяц. Хук зашёл. Попробовать похожий формат для следующего шортса.',
  },
]

const mockSeoVariant = {
  seoTitle: 'Stop Checking Your Phone in the Morning (Do This Instead)',
  seoDescription: 'Most people lose their best hours to mindless scrolling. In this video I share the one morning habit that doubled my focus and cut my anxiety in half — no willpower required.',
  hashtags: ['productivity', 'morningroutine', 'focustips', 'digitalwellness', 'selfimprovement'],
  seoTitleTr: 'Перестань проверять телефон утром (делай вот это)',
  seoDescriptionTr: 'Большинство людей теряют лучшие часы на бездумный скроллинг. В этом видео — одна утренняя привычка, которая удвоила мой фокус и снизила тревогу вдвое.',
}

const platformIcon: Record<string, string> = {
  youtube: '▶️',
  tiktok: '🎵',
  instagram: '📸',
}

const platformColor: Record<string, string> = {
  youtube: 'text-red-500',
  tiktok: 'text-stone-900',
  instagram: 'text-purple-500',
}

export default function WrapPage() {
  const [selectedScriptId, setSelectedScriptId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [seoData, setSeoData] = useState(mockSeoVariant)
  const [publications, setPublications] = useState<Publication[]>(mockPublications)
  const [openPubId, setOpenPubId] = useState<string | null>(null)
  const [editLinks, setEditLinks] = useState<Record<string, Record<string, string>>>({})
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})

  const selectedScript = mockScripts.find(s => s.id === selectedScriptId)
  const showTranslation = selectedScript
    ? selectedScript.inputLang !== selectedScript.outputLang
    : false

  const handleGenerate = () => {
    if (!selectedScriptId) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 1200)
  }

  const handleSave = () => {
    if (!selectedScript || !generated) return
    const newPub: Publication = {
      id: `pub-${Date.now()}`,
      scriptId: selectedScript.id,
      scriptTitle: selectedScript.title,
      seoTitle: seoData.seoTitle,
      seoDescription: seoData.seoDescription,
      hashtags: seoData.hashtags,
      createdAt: new Date().toISOString().slice(0, 10),
      links: { youtube: '', tiktok: '', instagram: '' },
      views: {},
      notes: '',
    }
    setPublications(prev => [newPub, ...prev])
    setGenerated(false)
    setSelectedScriptId('')
    setOpenPubId(newPub.id)
  }

  const getLink = (pubId: string, platform: string, fallback: string) =>
    editLinks[pubId]?.[platform] ?? fallback

  const setLink = (pubId: string, platform: string, value: string) =>
    setEditLinks(prev => ({ ...prev, [pubId]: { ...(prev[pubId] ?? {}), [platform]: value } }))

  const getNotes = (pubId: string, fallback: string) =>
    editNotes[pubId] ?? fallback

  const setNotes = (pubId: string, value: string) =>
    setEditNotes(prev => ({ ...prev, [pubId]: value }))

  const totalViews = (pub: Publication) => {
    return (pub.views.youtube ?? 0) + (pub.views.tiktok ?? 0) + (pub.views.instagram ?? 0)
  }

  return (
    <Layout breadcrumbs={[{ label: 'Wrap' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Wrap</h1>
          <p className="text-stone-400 text-sm">
            SEO-заголовок и описание для всех платформ. Добавь ссылку после публикации — следи за просмотрами.
          </p>
        </div>

        {/* Generator */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-stone-700 mb-3">Сгенерировать описание</h2>

          <select
            value={selectedScriptId}
            onChange={e => { setSelectedScriptId(e.target.value); setGenerated(false) }}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 text-stone-700 mb-4 cursor-pointer"
          >
            <option value="">— Выбери скрипт —</option>
            {mockScripts.map(s => (
              <option key={s.id} value={s.id}>
                {s.type === 'shorts' ? '⚡' : '🎬'} {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={!selectedScriptId || generating}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {generating ? 'Генерирую…' : 'Сгенерировать →'}
          </button>

          {/* Generated result */}
          {generated && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="h-px bg-stone-100" />

              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">SEO Title</p>
                <p className="text-stone-900 font-medium text-sm">{seoData.seoTitle}</p>
                {showTranslation && (
                  <p className="text-xs text-stone-400 italic mt-1">{seoData.seoTitleTr}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-stone-700 text-sm leading-relaxed">{seoData.seoDescription}</p>
                {showTranslation && (
                  <p className="text-xs text-stone-400 italic mt-1 leading-relaxed">{seoData.seoDescriptionTr}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {seoData.hashtags.map(tag => (
                    <span key={tag} className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                >
                  Сохранить →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Publications list */}
        {publications.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">
              Публикации ({publications.length})
            </h2>
            <div className="flex flex-col gap-3">
              {publications.map(pub => {
                const isOpen = openPubId === pub.id
                const total = totalViews(pub)

                return (
                  <div key={pub.id}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden transition">

                    {/* Card header */}
                    <div
                      onClick={() => setOpenPubId(isOpen ? null : pub.id)}
                      className="p-4 cursor-pointer hover:bg-stone-50 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{pub.seoTitle}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {pub.scriptTitle} · {pub.createdAt}
                          {total > 0 && (
                            <span className="ml-2 text-teal-600 font-medium">
                              {total.toLocaleString()} просмотров
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-stone-300 text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="border-t border-stone-100 px-4 pb-4 pt-3 flex flex-col gap-4">

                        {/* SEO content */}
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">SEO Title</p>
                          <p className="text-stone-900 text-sm font-medium">{pub.seoTitle}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Description</p>
                          <p className="text-stone-600 text-sm leading-relaxed">{pub.seoDescription}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Hashtags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pub.hashtags.map(tag => (
                              <span key={tag} className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Platform links */}
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Ссылки</p>
                          <div className="flex flex-col gap-2">
                            {(['youtube', 'tiktok', 'instagram'] as const).map(platform => (
                              <div key={platform} className="flex items-center gap-2">
                                <span className={`text-sm w-5 shrink-0 ${platformColor[platform]}`}>
                                  {platformIcon[platform]}
                                </span>
                                <input
                                  type="url"
                                  placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                                  value={getLink(pub.id, platform, pub.links[platform] ?? '')}
                                  onChange={e => setLink(pub.id, platform, e.target.value)}
                                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500 placeholder-stone-300"
                                />
                                {pub.views[platform] !== undefined && (
                                  <span className="text-xs text-stone-400 shrink-0 w-20 text-right">
                                    {pub.views[platform]!.toLocaleString()} views
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Заметки</p>
                          <textarea
                            value={getNotes(pub.id, pub.notes)}
                            onChange={e => setNotes(pub.id, e.target.value)}
                            placeholder="Что сработало? Что попробовать в следующий раз?"
                            rows={2}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 resize-none placeholder-stone-300"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg transition">
                            Сохранить изменения
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
