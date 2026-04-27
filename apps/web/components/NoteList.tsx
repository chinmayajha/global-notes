'use client'

import { useEffect, useRef } from 'react'
import { NoteCard } from './NoteCard'
import type { Note } from '@global-notes/shared'

interface Props {
  notes: Note[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDelete: (id: string) => void
  onUpdate: (note: Note) => void
  onTagClick: (tag: string) => void
}

export function NoteList({ notes, loading, hasMore, onLoadMore, onDelete, onUpdate, onTagClick }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) onLoadMore()
    }, { rootMargin: '200px' })

    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!loading && notes.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400 dark:text-neutral-600 text-sm">
        No notes yet. Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">n</kbd> to start capturing.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onTagClick={onTagClick}
        />
      ))}

      {loading && (
        <div className="text-center py-6 text-neutral-400 text-xs">Loading…</div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}
