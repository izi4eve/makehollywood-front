import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'

const mockVariants = [
  {
    id: 1,
    hook: "Most people waste their mornings doing this one thing.",
    body: "You wake up, grab your phone, and suddenly 40 minutes are gone. Here's what high performers do instead: they protect the first hour. No notifications, no social media — just one focused task that moves the needle.",
    cta: "Try this tomorrow and tell me what changed.",
  },
  {
    id: 2,
    hook: "Your morning routine is silently killing your productivity.",
    body: "The problem isn't discipline — it's design. When you check messages first thing, your brain enters reactive mode for the rest of the day. The fix is simpler than you think: decide your top priority the night before.",
    cta: "Save this and share it with someone who needs a reset.",
  },
  {
    id: 3,
    hook: "I changed one thing in my morning and doubled my output.",
    body: "It sounds too simple: I stopped checking my phone for the first 30 minutes. Instead I spent that time on whatever I'd been avoiding. Within a week my anxiety dropped and I was finishing projects I'd postponed for months.",
    cta: "Follow for more no-nonsense productivity tips.",
  },
]

export default function ScriptPage() {
  const location = useLocation()
  const projectType = location.state?.type ?? 'shorts'
  const [idea, setIdea] = useState('')
  const [generated, setGenerated] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  const handleGenerate = () => {
    if (!idea.trim()) return
    setGenerated(true)
    setSelected(null)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex gap-2">
            {['Script', 'Voice', 'Video'].map((tab, i) => (
              <span
                key={tab}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  i === 0
                    ? 'bg-teal-600 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
          <span className="text-xs text-stone-400 ml-auto capitalize">{projectType}</span>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            What is your video about?
          </label>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Describe your idea, the main message, and who it's for. The more context you give, the better the result."
            rows={4}
            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none placeholder-stone-400"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!idea.trim()}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition mb-10"
        >
          Generate 3 variants →
        </button>

        {/* Variants */}
        {generated && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Choose a variant</h2>
            <div className="flex flex-col gap-4">
              {mockVariants.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`border rounded-xl p-5 cursor-pointer transition ${
                    selected === v.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">Hook</p>
                  <p className="text-stone-900 font-medium mb-3">{v.hook}</p>
                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">Body</p>
                  <p className="text-stone-600 text-sm mb-3">{v.body}</p>
                  <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">CTA</p>
                  <p className="text-stone-600 text-sm">{v.cta}</p>
                </div>
              ))}
            </div>

            {selected && (
              <div className="mt-6 flex justify-end">
                <button className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition">
                  Use this script → Voice
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
