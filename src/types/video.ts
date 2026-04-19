export type VideoStatus = 'draft' | 'assembled' | 'exported'

export interface VideoClip {
  id: string
  textChunk: string
  stockUrl?: string
  stockSource: 'pexels' | 'personal' | 'manual'
  durationSec?: number
}

export interface Video {
  id: string
  scriptId: string
  voiceId?: string
  scriptTitle: string
  status: VideoStatus
  clips: VideoClip[]
  createdAt: string
}

// Director (Footage) types
export type FootageStatus = 'uploaded' | 'analyzing' | 'story_ready' | 'exported'

export interface FootageProject {
  id: string
  title: string
  status: FootageStatus
  fileCount: number
  totalDurationSec?: number
  createdAt: string
}
