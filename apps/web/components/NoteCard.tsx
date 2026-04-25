'use client'

import { useState } from 'react'
import type { Note } from '@global-notes/shared'

const SOURCE_LABELS: Record<string, string> = {
  web: 'web',
  cli: 'cli',
  extension: 'ext',
  desktop: 'desktop',
  share: 'share',
  api: 'api',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

interface Props {
  note: Note
  onDelete: (id: string) => void
  onUpdate: (note: Note) => void
  onTagClick: (tag: string) => void
}

export function NoteCard({ note, onDelete, onUpdate, onTagClick }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveEdit = async () => {
    if (!editValue.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue.trim() }),
      })
      if (res.ok) {
        const updated: Note = await res.json()
        onUpdate(updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async () => {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    if (res.ok) onUpdate(await res.json())
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
    onDelete(note.id)
  }

  return (
    <div className={`group relative rounded-xl border bg-white dark:bg-neutral-900 p-4 text-sm transition ${note.pinned ? 'border-neutral-400 dark:border-neutral-600' : 'border-neutral-100 dark:border-neutral-800'}`}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400 dark:text-neutral-600">
        <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 dark:text-neutral-400">
          {SOURCE_LABELS[note.source] ?? note.source}
        </span>
        {note.source_title && (
          <a
            href={note.source_url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate max-w-[200px] hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            {note.source_title}
          </a>
        )}
        <span className="ml-auto">{relativeTime(note.created_at)}</span>
        {note.pinned && <span title="Pinned">📌</span>}
      </div>

      {/* Content */}
      {editing ? (
        <div>
          <textarea
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') { setEditing(false); setEditValue(note.content) }
            }}
            className="w-full resize-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            rows={Math.max(3, editValue.split('\n').length)}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={saveEdit} disabled={saving} className="text-xs px-2.5 py-1 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setEditValue(note.content) }} className="text-xs px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
          {note.content}
        </p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && !editing && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Actions — appear on hover */}
      {!editing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={togglePin} title={note.pinned ? 'Unpin' : 'Pin'} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 text-xs">
            {note.pinned ? '⊘' : '📌'}
          </button>
          <button onClick={() => setEditing(true)} title="Edit" className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 text-xs">
            ✏️
          </button>
          <button
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            className={`p-1 rounded text-xs transition ${confirmDelete ? 'bg-red-100 dark:bg-red-900 text-red-600' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'}`}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? 'Confirm?' : '🗑'}
          </button>
        </div>
      )}
    </div>
  )
}
