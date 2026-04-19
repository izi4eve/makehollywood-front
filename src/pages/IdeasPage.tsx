import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { mockIdeas } from '../data/mockIdeas'
import type { ExtractedTopic } from '../types/idea'

const allTopics: ExtractedTopic[] = mockIdeas.flatMap(i => i.extractedTopics)

export default function IdeasPage() {
  const navigate = useNavigate()
  const [rawText, setRawText] = useState('')
  const [topics, setTopics] = useState<ExtractedTopic[]>(allTopics)
  const [extracting, setExtracting] = useState(false)

  const mediaList = topics.filter(t => t.addedToMedia)

  const handleExtract = () => {
    if (!rawText.trim()) return
    setExtracting(true)
    // TODO: call AI API
    setTimeout(() => setExtracting(false), 1200)
  }

  const toggleMedia = (id: string) => {
    setTopics(prev =>
      prev.map(t => t.id === id ? { ...t, addedToMedia: !t.addedToMedia } : t)
    )
  }

  const handleStartScript = (topic: ExtractedTopic, type: 'shorts' | 'series') => {
    const path = type === 'shorts' ? '/shorts/new' : '/series/new'
    navigate(path, { state: { theme: topic.theme, angle: topic.angle } })
  }

  return (
    <Layout breadcrumbs={[{ label: 'Ideas' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Ideas</h1>
          <p className="text-stone-400 text-sm">
            Набросай мысли в свободной форме — ИИ вытащит темы и углы для видео.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Что на уме?
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Пиши что угодно — наблюдения, проблемы, вещи о которых тебя спрашивают, случайные заметки. Без структуры."
            rows={5}
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleExtract}
              disabled={!rawText.trim() || extracting}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {extracting ? 'Извлекаю идеи…' : 'Извлечь темы для видео →'}
            </button>
          </div>
        </div>

        {/* Extracted topics */}
        {topics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Извлечённые темы</h2>
            <div className="flex flex-col gap-3">
              {topics.map(topic => (
                <div
                  key={topic.id}
                  className={`bg-white border rounded-xl p-4 transition ${
                    topic.addedToMedia ? 'border-teal-300 bg-teal-50/30' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-stone-900 font-medium text-sm mb-1">{topic.theme}</p>
                      <p className="text-stone-400 text-xs leading-relaxed">{topic.angle}</p>
                    </div>
                    <button
                      onClick={() => toggleMedia(topic.id)}
                      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                        topic.addedToMedia
                          ? 'bg-teal-100 text-teal-700 hover:bg-red-50 hover:text-red-500'
                          : 'bg-stone-100 text-stone-500 hover:bg-teal-50 hover:text-teal-600'
                      }`}
                    >
                      {topic.addedToMedia ? '✓ В плане' : '+ В план'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartScript(topic, 'shorts')}
                      className="text-xs text-stone-400 hover:text-teal-600 border border-stone-200 hover:border-teal-300 px-3 py-1 rounded-lg transition"
                    >
                      ⚡ Shorts script
                    </button>
                    <button
                      onClick={() => handleStartScript(topic, 'series')}
                      className="text-xs text-stone-400 hover:text-teal-600 border border-stone-200 hover:border-teal-300 px-3 py-1 rounded-lg transition"
                    >
                      🎬 Series script
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media plan */}
        {mediaList.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-orange-700">
                Медиа-план ({mediaList.length})
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {mediaList.map((topic, i) => (
                <div key={topic.id} className="flex items-center gap-2">
                  <span className="text-xs text-orange-300 w-5 shrink-0">{i + 1}.</span>
                  <span className="text-sm text-orange-800">{topic.theme}</span>
                  <button
                    onClick={() => handleStartScript(topic, 'shorts')}
                    className="ml-auto text-xs text-orange-400 hover:text-orange-600 transition shrink-0"
                  >
                    Начать →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
