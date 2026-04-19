import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const mockVideos = [
  {
    id: 'vid1',
    scriptTitle: 'Утро без телефона',
    status: 'assembled',
    clipCount: 6,
  },
]

export default function VideoPage() {
  const navigate = useNavigate()

  return (
    <Layout breadcrumbs={[{ label: 'Video' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Video</h1>
          <p className="text-stone-400 text-sm">
            Подбор видеорядя под текст. Стоки по смыслу → черновик для монтажа.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { step: '1', icon: '✂️', title: 'Разбивка текста', desc: 'Скрипт делится на смысловые блоки' },
            { step: '2', icon: '🎬', title: 'Подбор стоков', desc: '3 видео + 3 фото из Pexels и личного стока' },
            { step: '3', icon: '📦', title: 'Черновик', desc: 'Готовый файл для финального монтажа' },
          ].map(item => (
            <div key={item.step} className="bg-white border border-stone-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-stone-900 mb-1">{item.title}</p>
              <p className="text-xs text-stone-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Existing videos */}
        {mockVideos.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Собранные видео</h2>
            <div className="flex flex-col gap-3 mb-8">
              {mockVideos.map(vid => (
                <div key={vid.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-teal-400 cursor-pointer transition">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{vid.scriptTitle}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{vid.clipCount} клипов · Assembled</p>
                  </div>
                  <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                    Экспорт
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Start new */}
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center">
          <p className="text-stone-400 text-sm mb-4">
            Выбери озвученный скрипт, чтобы начать подбор видеоряда
          </p>
          <button onClick={() => navigate('/voice')}
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
            ← Выбрать озвучку
          </button>
        </div>

        <div className="mt-6 bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
          <p className="text-sm text-stone-400">
            🚧 Подбор стоков из Pexels и личного стока — в разработке.
          </p>
        </div>
      </div>
    </Layout>
  )
}
