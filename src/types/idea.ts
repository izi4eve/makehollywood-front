export interface ExtractedTopic {
  id: string
  theme: string
  angle: string
  addedToMedia: boolean
}

export interface Idea {
  id: string
  rawText: string
  extractedTopics: ExtractedTopic[]
  createdAt: string
}
