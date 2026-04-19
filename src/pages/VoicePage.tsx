import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const mockVoiceTracks = [
  { id: 'v1', scriptTitle: 'Утро без телефона', method: 'tts', status: 'generated', durationSec: 47 },
  { id: 'v2', scriptTitle: 'Топ-5 приложений для продуктивности', method: 'record', status: 'pending', durationSec: undefined },
]

export default function VoicePage() {
  const navigate = useNavigate()

  return (
    <Layout breadcrumbs={[{ label: 'Voice' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Voice</h1>
          <p className="text-stone-400 text-sm">
            Озвучка готового текста. TTS — автоматически, Record — запишешь сам.
          </p>
        </div>

        {/* Method choice */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-xl p-5 text-center hover:border-teal-400 cursor-pointer transition group">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-stone-900 group-hover:text-teal-700 transition mb-1">TTS</h3>
            <p className="text-xs text-stone-400">Синтез речи. Выбери голос, скорость, интонацию.</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5 text-center hover:border-teal-400 cursor-pointer transition group">
            <div className="text-3xl mb-3">🎙️</div>
            <h3 className="font-semibold text-stone-900 group-hover:text-teal-700 transition mb-1">Record</h3>
            <p className="text-xs text-stone-400">Запись своего голоса прямо в браузере.</p>
          </div>
        </div>

        {/* Existing tracks */}
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Готовые озвучки</h2>
        <div className="flex flex-col gap-3">
          {mockVoiceTracks.map(track => (
            <div key={track.id}
              className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-teal-400 cursor-pointer transition">
              <div>
                <p className="text-sm font-medium text-stone-900">{track.scriptTitle}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {track.method === 'tts' ? '🤖 TTS' : '🎙️ Record'}
                  {track.durationSec ? ` · ${track.durationSec}с` : ' · не записано'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${track.status === 'generated' ? 'text-teal-600' : 'text-stone-400'}`}>
                  {track.status === 'generated' ? 'Готово' : 'Ожидание'}
                </span>
                {track.status === 'generated' && (
                  <button onClick={() => navigate('/video')}
                    className="text-xs bg-orange-500 hover:bg-orange-400 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                    → Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="mt-8 bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
          <p className="text-sm text-stone-400">
            🚧 Полная функциональность в разработке. Выбор голосов, скорость, предпрослушивание.
          </p>
        </div>
      </div>
    </Layout>
  )
}
