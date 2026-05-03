import { apiFetch } from './apiFetch'

export interface GeneratedLongform {
  text: string
  tr?: string
  title?: string
}

export interface LongformResponse {
  id: number
  source: string
  coreMessage?: string
  title?: string
  fullText: string
  fullTextTr?: string
  inputLang: string
  outputLang: string
  createdAt: string
  updatedAt: string
}

export async function generateLongform(
  source: string,
  coreMessage: string,
  inputLang: string,
  outputLang: string,
  token: string,
  style?: string,
  voice?: string,
  length?: string
): Promise<GeneratedLongform> {
  const res = await apiFetch('/api/longforms/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, coreMessage, inputLang, outputLang, style, voice, length }),
  }, token)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'unknown')
  }
  return res.json()
}

export async function refineLongform(
  text: string,
  instruction: string,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<GeneratedLongform> {
  const res = await apiFetch('/api/longforms/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, instruction, inputLang, outputLang }),
  }, token)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'unknown')
  }
  return res.json()
}

export async function saveLongform(
  source: string,
  coreMessage: string,
  title: string,
  fullText: string,
  fullTextTr: string | undefined,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<LongformResponse> {
  const res = await apiFetch('/api/longforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, coreMessage, title, fullText, fullTextTr, inputLang, outputLang }),
  }, token)
  if (!res.ok) throw new Error('save_failed')
  return res.json()
}

export async function fetchLongforms(token: string): Promise<LongformResponse[]> {
  const res = await apiFetch('/api/longforms', {
    method: 'GET',
    headers: {},
  }, token)
  if (!res.ok) throw new Error('fetch_failed')
  return res.json()
}

export async function updateLongform(
  id: number,
  title: string,
  fullText: string,
  token: string
): Promise<LongformResponse> {
  const res = await apiFetch(`/api/longforms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, fullText }),
  }, token)
  if (!res.ok) throw new Error('update_failed')
  return res.json()
}

export async function deleteLongform(id: number, token: string): Promise<void> {
  const res = await apiFetch(`/api/longforms/${id}`, {
    method: 'DELETE',
    headers: {},
  }, token)
  if (!res.ok) throw new Error('delete_failed')
}
