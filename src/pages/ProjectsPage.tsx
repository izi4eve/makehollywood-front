import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProjectCard from '../components/ProjectCard'
import { mockProjects } from '../data/mockProjects'

export default function ProjectsPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Projects</h1>
        <button
          onClick={() => navigate('/projects/new')}
          className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + New Project
        </button>
      </div>

      {mockProjects.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Layout>
  )
}
