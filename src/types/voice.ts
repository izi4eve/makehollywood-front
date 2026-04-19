export type VoiceMethod = 'tts' | 'record'
export type VoiceStatus = 'pending' | 'generated' | 'recorded'

export interface VoiceTrack {
  id: string
  scriptId: string
  scriptTitle: string
  method: VoiceMethod
  status: VoiceStatus
  durationSec?: number
  createdAt: string
}
