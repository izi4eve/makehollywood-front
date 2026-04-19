import { useState } from 'react'
import Layout from '../components/Layout'

const mockFootage = [
  { id: 'f1', title: 'Свадьба Анна & Макс', fileCount: 47, status: 'story_ready', totalDurationSec: 14400 },
  { id: 'f2', title: 'Новогодний корпоратив', fileCount: 112, status: 'analyzing', totalDurationSec: undefined },
]

const statusLabel: Record<string, string> = {
  uploaded: 'Загружено',
  analyzing: 'Анализирую…',
  story_ready: 'Сценарий готов',
  exported: 'Экспортировано',
}

const statusColor: Record<string, string> = {
  uploaded: 'text-stone-400',
  analyzing: 'text-orange-400',
  story_ready: 'text-teal-600',
  exported: 'text-purple-500',
}

export default function DirectorPage() {
  const [dragging, setDragging] = useState(false)

  return (
    <Layout breadcrumbs={[{ label: 'Director' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Director</h1>
          <p className="text-stone-400 text-sm">
            Горы хаотичного видео → интересный сценарий. ИИ анализирует, расшифровывает, находит историю.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: '📁', title: 'Загружаешь всё что есть', desc: 'Видео со свадьбы, корпоратива, телефона — любой хаос' },
            { icon: '🔍', title: 'ИИ анализирует', desc: 'Распознаёт речь, лица, эмоции, хронометраж' },
            { icon: '📝', title: 'Предлагает сценарий', desc: 'Структурирует по смыслу: начало, кульминация, финал' },
            { icon: '🎬', title: 'Черновик для монтажа', desc: 'Обрезанные клипы в нужном порядке — остаётся только финал' },
          ].map(item => (
            <div key={item.title} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-stone-900 mb-1">{item.title}</p>
              <p className="text-xs text-stone-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false) }}
          className={`border-2 border-dashed rounded-xl p-10 text-center mb-8 transition cursor-pointer ${
            dragging ? 'border-teal-500 bg-teal-50' : 'border-stone-300 hover:border-stone-400 bg-stone-50'
          }`}
        >
          <div className="text-4xl mb-3">🎥</div>
          <p className="text-stone-700 font-medium mb-1">Перетащи видео или кликни чтобы выбрать</p>
          <p className="text-xs text-stone-400">MP4, MOV, AVI · любое количество · до 50 ГБ</p>
          <button className="mt-4 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
            + Upload Footage
          </button>
        </div>

        {/* Existing footage projects */}
        {mockFootage.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Мои проекты</h2>
            <div className="flex flex-col gap-3">
              {mockFootage.map(fp => (
                <div key={fp.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-teal-400 cursor-pointer transition">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{fp.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {fp.fileCount} файлов
                      {fp.totalDurationSec ? ` · ${Math.round(fp.totalDurationSec / 3600)}ч материала` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${statusColor[fp.status]}`}>
                      {statusLabel[fp.status]}
                    </span>
                    {fp.status === 'story_ready' && (
                      <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                        Смотреть сценарий
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
          <p className="text-sm text-stone-400">
            🚧 Анализ видео через Whisper + Vision модели — в разработке.
          </p>
        </div>
      </div>
    </Layout>
  )
}
