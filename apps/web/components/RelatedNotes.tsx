'use client'

import { useState } from 'react'
import type { Note } from '@global-notes/shared'

interface Props {
  relatedIds: string[]
  onNoteClick?: (note: Note) => void
}

export function RelatedNotes({ relatedIds, onNoteClick }: Props) {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [loading, setLoading] = useState(false)

  if (relatedIds.length === 0) return null

  const load = async () => {
    if (notes !== null || loading) return
    setLoading(true)
    try {
      const results = await Promise.all(
        relatedIds.slice(0, 3).map(id => fetch(`/api/notes/${id}`).then(r => r.ok ? r.json() : null))
      )
      setNotes(results.filter(Boolean))
    } catch {
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
      <button
        onClick={load}
        className="text-[11px] text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition"
      >
        {notes === null
          ? `${relatedIds.length} related note${relatedIds.length > 1 ? 's' : ''} →`
          : 'Related:'}
      </button>

      {loading && <span className="ml-2 text-[11px] text-neutral-400">loading…</span>}

      {notes && notes.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {notes.map(n => (
            <li key={n.id}>
              <button
                onClick={() => onNoteClick?.(n)}
                className="text-left text-[11px] text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 leading-relaxed line-clamp-1 transition"
              >
                {n.content.slice(0, 100)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
