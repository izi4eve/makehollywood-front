import { apiFetch } from './apiFetch'

export interface StockClip {
  id: number
  filename: string
  localPath: string
  description: string
  orientation: 'vertical' | 'horizontal' | null
  width: number | null
  height: number | null
  durationSec: number | null
  indexed: boolean
  missing: boolean
  createdAt: string
  updatedAt: string
}

export async function fetchStockClips(token: string): Promise<StockClip[]> {
  const res = await apiFetch('/api/stock', { method: 'GET', headers: {} }, token)
  if (!res.ok) throw new Error('fetch_failed')
  return res.json()
}

export async function createStockClip(
  payload: {
    filename: string
    localPath: string
    orientation: 'vertical' | 'horizontal'
    width: number
    height: number
    durationSec: number
  },
  token: string
): Promise<StockClip> {
  const res = await apiFetch('/api/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, token)
  if (!res.ok) throw new Error('create_failed')
  return res.json()
}

export async function updateStockClipDescription(
  id: number,
  description: string,
  token: string
): Promise<StockClip> {
  const res = await apiFetch(`/api/stock/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  }, token)
  if (!res.ok) throw new Error('update_failed')
  return res.json()
}

export async function relinkStockClip(
  id: number,
  payload: {
    filename: string
    orientation: 'vertical' | 'horizontal'
    width: number
    height: number
    durationSec: number
  },
  token: string
): Promise<StockClip> {
  const res = await apiFetch(`/api/stock/${id}/relink`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, token)
  if (!res.ok) throw new Error('relink_failed')
  return res.json()
}

export async function deleteStockClip(id: number, token: string): Promise<void> {
  const res = await apiFetch(`/api/stock/${id}`, { method: 'DELETE', headers: {} }, token)
  if (!res.ok) throw new Error('delete_failed')
}
