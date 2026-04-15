import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const projectTypes = [
  {
    type: 'shorts',
    icon: '⚡',
    title: 'Shorts',
    description: 'Create a script for a short vertical video. AI helps you write hooks, body and CTA.',
  },
  {
    type: 'long_video',
    icon: '🎬',
    title: 'Long Video',
    description: 'A series of connected ideas structured like chapters. Each section flows into the next.',
  },
  {
    type: 'footage',
    icon: '📦',
    title: 'Footage Edit',
    description: 'Upload your raw video footage. AI analyzes it and builds a compelling story from your clips.',
  },
]

export default function NewProjectPage() {
  const navigate = useNavigate()

  const handleSelect = (type: string) => {
    const fakeId = Date.now().toString()
    navigate(`/projects/${fakeId}/script`, { state: { type } })
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">New Project</h1>
        <p className="text-stone-400 mb-8">What kind of video are you making?</p>

        <div className="flex flex-col gap-4">
          {projectTypes.map(pt => (
            <button
              key={pt.type}
              onClick={() => handleSelect(pt.type)}
              className="bg-white border border-stone-200 hover:border-teal-500 rounded-xl p-6 text-left transition group shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{pt.icon}</span>
                <span className="text-stone-900 font-semibold text-lg group-hover:text-teal-600 transition">
                  {pt.title}
                </span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">{pt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
