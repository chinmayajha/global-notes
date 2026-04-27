'use client'

import { useState, useEffect } from 'react'

interface ApiKeyRow {
  id: string
  name: string
  created_at: string
  last_used: string | null
}

interface Props {
  onClose: () => void
}

export function SettingsPanel({ onClose }: Props) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/keys').then(r => r.json()).then(setKeys)
  }, [])

  const createKey = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setNewKey(data.key)
      setNewKeyName('')
      const refreshed = await fetch('/api/keys').then(r => r.json())
      setKeys(refreshed)
    }
    setCreating(false)
  }

  const deleteKey = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        <section>
          <h3 className="text-sm font-medium mb-3">API Keys</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-4">
            Keys authenticate the CLI and browser extension. Each key is shown only once.
          </p>

          {newKey && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1 font-medium">Copy this key now — it won't be shown again:</p>
              <code className="text-xs break-all select-all font-mono">{newKey}</code>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="Key name (e.g. CLI, Extension)"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <button
              onClick={createKey}
              disabled={creating || !newKeyName.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40"
            >
              Generate
            </button>
          </div>

          {keys.length > 0 && (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {keys.map(k => (
                <li key={k.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-neutral-400">
                      Created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used ? ` · Last used ${new Date(k.last_used).toLocaleDateString()}` : ' · Never used'}
                    </p>
                  </div>
                  <button onClick={() => deleteKey(k.id)} className="text-xs text-red-500 hover:text-red-700">Revoke</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-medium mb-3">Export</h3>
          <a
            href="/api/export"
            className="text-sm px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition inline-block"
          >
            Download all notes (JSON)
          </a>
        </section>
      </div>
    </div>
  )
}
