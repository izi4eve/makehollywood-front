import { useNavigate } from 'react-router-dom'
import type { Project } from '../types/project'

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  script_done: 'Script ready',
  voice_done: 'Voice ready',
  video_ready: 'Video ready',
  exported: 'Exported',
}

const statusColor: Record<string, string> = {
  draft: 'text-stone-400',
  script_done: 'text-teal-600',
  voice_done: 'text-purple-500',
  video_ready: 'text-green-500',
  exported: 'text-orange-500',
}

const typeLabel: Record<string, string> = {
  shorts: '⚡ Shorts',
  long_video: '🎬 Long Video',
  footage: '📦 Footage Edit',
}

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}/script`)}
      className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-teal-400 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-stone-400">{typeLabel[project.type]}</span>
        <span className={`text-xs font-medium ${statusColor[project.status]}`}>
          {statusLabel[project.status]}
        </span>
      </div>
      <h3 className="text-stone-900 font-semibold mb-4 leading-snug">{project.title}</h3>
      <p className="text-xs text-stone-400">{project.updatedAt}</p>
    </div>
  )
}
