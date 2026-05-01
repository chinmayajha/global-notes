import type { Note, PaginatedNotes } from '@global-notes/shared'

export class ApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey  = apiKey
  }

  private async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(opts.headers ?? {}),
      },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`API error ${res.status}: ${text}`)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  }

  async createNote(content: string): Promise<Note> {
    return this.request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ content, source: 'cli' }),
    })
  }

  async listNotes(page = 1): Promise<PaginatedNotes> {
    return this.request<PaginatedNotes>(`/api/notes?page=${page}&per_page=20`)
  }

  async searchNotes(q: string): Promise<PaginatedNotes> {
    return this.request<PaginatedNotes>(`/api/notes?q=${encodeURIComponent(q)}&per_page=20`)
  }

  async health(): Promise<boolean> {
    try {
      await this.request<{ ok: boolean }>('/api/health')
      return true
    } catch {
      return false
    }
  }
}
