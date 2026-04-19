export type ScriptType = 'shorts' | 'series'

export type ScriptStatus = 'draft' | 'done'

export interface ScriptVariant {
  id: number
  hook: string
  body: string
  cta: string
}

export interface Script {
  id: string
  type: ScriptType
  title: string
  description?: string
  inputLang: string
  outputLang: string
  status: ScriptStatus
  createdAt: string
  updatedAt: string
  // Series-specific
  seriesName?: string
  seriesPart?: number
  seriesTotal?: number
  // Selected variant content
  selectedHook?: string
  selectedBody?: string
  selectedCta?: string
}
