import { apiFetch } from './apiFetch'

export interface GeneratedVariant {
  text: string
  tr?: string
  name?: string
}

export interface ScriptResponse {
  id: number
  source: string
  coreMessage?: string
  name?: string
  fullText: string
  fullTextTr?: string
  inputLang: string
  outputLang: string
  createdAt: string
  updatedAt: string
}

export async function generateScripts(
  source: string,
  coreMessage: string,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<GeneratedVariant[]> {
  const res = await apiFetch('/api/scripts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, coreMessage, inputLang, outputLang }),
  }, token)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'unknown')
  }
  return res.json()
}

export async function refineScript(
  text: string,
  instruction: string,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<GeneratedVariant> {
  const res = await apiFetch('/api/scripts/refine', {
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

export async function saveScript(
  source: string,
  coreMessage: string,
  name: string,
  fullText: string,
  fullTextTr: string | undefined,
  inputLang: string,
  outputLang: string,
  token: string
): Promise<ScriptResponse> {
  const res = await apiFetch('/api/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, coreMessage, name, fullText, fullTextTr, inputLang, outputLang }),
  }, token)
  if (!res.ok) throw new Error('save_failed')
  return res.json()
}

export async function fetchScripts(token: string): Promise<ScriptResponse[]> {
  const res = await apiFetch('/api/scripts', {
    method: 'GET',
    headers: {},
  }, token)
  if (!res.ok) throw new Error('fetch_failed')
  return res.json()
}

export async function updateScript(
  id: number,
  name: string,
  fullText: string,
  token: string
): Promise<ScriptResponse> {
  const res = await apiFetch(`/api/scripts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, fullText }),
  }, token)
  if (!res.ok) throw new Error('update_failed')
  return res.json()
}

export async function deleteScript(id: number, token: string): Promise<void> {
  const res = await apiFetch(`/api/scripts/${id}`, {
    method: 'DELETE',
    headers: {},
  }, token)
  if (!res.ok) throw new Error('delete_failed')
}
