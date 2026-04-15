import type { Project } from '../types/project'

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'How to wake up at 5am',
    type: 'shorts',
    status: 'script_done',
    createdAt: '2026-04-10',
    updatedAt: '2026-04-11',
  },
  {
    id: '2',
    title: 'Wedding highlights — Anna & Max',
    type: 'footage',
    status: 'draft',
    createdAt: '2026-04-13',
    updatedAt: '2026-04-13',
  },
  {
    id: '3',
    title: 'Top 5 productivity apps',
    type: 'shorts',
    status: 'voice_done',
    createdAt: '2026-04-14',
    updatedAt: '2026-04-15',
  },
]