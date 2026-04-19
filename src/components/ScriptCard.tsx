import { useNavigate } from 'react-router-dom'
import type { Script } from '../types/script'

const statusColor: Record<string, string> = {
  draft: 'text-stone-400',
  done: 'text-teal-600',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  done: 'Done',
}

const langFlag: Record<string, string> = {
  en: '🇬🇧', de: '🇩🇪', ru: '🇷🇺', fr: '🇫🇷', es: '🇪🇸', uk: '🇺🇦',
}

export default function ScriptCard({ script }: { script: Script }) {
  const navigate = useNavigate()
  const path = script.type === 'shorts' ? `/shorts/${script.id}` : `/series/${script.id}`

  return (
    <div
      onClick={() => navigate(path)}
      className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-teal-400 hover:shadow-md transition group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {script.inputLang !== script.outputLang ? (
            <span className="text-xs text-stone-400">
              {langFlag[script.inputLang] ?? script.inputLang} → {langFlag[script.outputLang] ?? script.outputLang}
            </span>
          ) : (
            <span className="text-xs text-stone-400">
              {langFlag[script.outputLang] ?? script.outputLang}
            </span>
          )}
        </div>
        <span className={`text-xs font-medium ${statusColor[script.status]}`}>
          {statusLabel[script.status]}
        </span>
      </div>

      <h3 className="text-stone-900 font-semibold mb-1.5 leading-snug group-hover:text-teal-700 transition">
        {script.title}
      </h3>

      {script.description && (
        <p className="text-xs text-stone-400 leading-relaxed mb-3 line-clamp-2">
          {script.description}
        </p>
      )}

      {script.seriesName && (
        <p className="text-xs text-orange-400 mb-2">
          {script.seriesName}
          {script.seriesPart && script.seriesTotal
            ? ` · ${script.seriesPart}/${script.seriesTotal}`
            : ''}
        </p>
      )}

      <p className="text-xs text-stone-300">{script.updatedAt}</p>
    </div>
  )
}
