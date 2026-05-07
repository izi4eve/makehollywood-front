import { apiFetch } from './apiFetch'

export async function fetchSettings(token: string): Promise<Record<string, string>> {
  const res = await apiFetch('/api/settings', { method: 'GET', headers: {} }, token)
  if (!res.ok) throw new Error('fetch_failed')
  return res.json()
}

export async function putSetting(key: string, value: string, token: string): Promise<void> {
  const res = await apiFetch(`/api/settings/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }, token)
  if (!res.ok) throw new Error('put_failed')
}

export async function deleteSetting(key: string, token: string): Promise<void> {
  const res = await apiFetch(`/api/settings/${key}`, { method: 'DELETE', headers: {} }, token)
  if (!res.ok) throw new Error('delete_failed')
}
