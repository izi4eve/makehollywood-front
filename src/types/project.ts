export type ProjectType = 'shorts' | 'long_video' | 'footage'

export type ProjectStatus = 'draft' | 'script_done' | 'voice_done' | 'video_ready' | 'exported'

export interface Project {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  script?: string
}