import { apiFetch } from './apiFetch'

const API = '/api/ideas'

export interface ExtractedIdea {
  text: string
  tr?: string
}

export interface IdeaResponse {
  id: number
  source: string
  idea: string
  ideaTr?: string
  inputLang: string
  outputLang: string
  used: boolean
  createdAt: string
}

export async function extractIdeas(
  text: string,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<ExtractedIdea[]> {
  const res = await apiFetch(`${API}/extract`, {
    method: 'POST',
    body: JSON.stringify({ text, inputLang, outputLang }),
  }, token)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    if (data.error === 'moderation') throw new Error('moderation')
    if (data.error === 'rate_limit') throw new Error('rate_limit')
    if (data.error === 'timeout') throw new Error('timeout')
    throw new Error('extraction_failed')
  }
  return res.json()
}

export async function saveIdea(
  source: string,
  idea: string,
  ideaTr: string | undefined,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<IdeaResponse> {
  const res = await apiFetch(API, {
    method: 'POST',
    body: JSON.stringify({ source, idea, ideaTr, inputLang, outputLang }),
  }, token)
  if (!res.ok) throw new Error('Failed to save idea')
  return res.json()
}

export async function fetchIdeas(token: string): Promise<IdeaResponse[]> {
  const res = await apiFetch(API, {
    method: 'GET',
  }, token)
  if (!res.ok) throw new Error('Failed to fetch ideas')
  return res.json()
}

export async function updateIdea(
  id: number,
  source: string,
  idea: string,
  token: string
): Promise<IdeaResponse> {
  const res = await apiFetch(`${API}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ source, idea }),
  }, token)
  if (!res.ok) throw new Error('Failed to update idea')
  return res.json()
}

export async function markIdeaUsed(
  id: number,
  used: boolean,
  token: string
): Promise<IdeaResponse> {
  const res = await apiFetch(`${API}/${id}/used`, {
    method: 'PATCH',
    body: JSON.stringify({ used }),
  }, token)
  if (!res.ok) throw new Error('Failed to mark idea')
  return res.json()
}

export async function deleteIdea(id: number, token: string): Promise<void> {
  const res = await apiFetch(`${API}/${id}`, {
    method: 'DELETE',
  }, token)
  if (!res.ok) throw new Error('Failed to delete idea')
}
