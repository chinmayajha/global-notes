'use client'

import { useRef, useState, useEffect } from 'react'
import type { Note } from '@global-notes/shared'

interface Props {
  onCreated: (note: Note) => void
}

export function NoteInput({ onCreated }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-focus on mount and when pressing 'n' globally
  useEffect(() => {
    ref.current?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return
        e.preventDefault()
        ref.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auto-grow textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      setValue('')
      ref.current?.blur()
    }
  }

  const submit = async () => {
    const content = value.trim()
    if (!content || saving) return

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, source: 'web' }),
      })

      if (!res.ok) throw new Error('Failed to save')

      const note: Note = await res.json()
      onCreated(note)
      setValue('')
      if (ref.current) ref.current.style.height = 'auto'
    } catch {
      setError('Could not save — check your connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind? #tag to categorize  ·  ⌘↵ to save"
        rows={2}
        className="w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition scrollbar-thin"
        style={{ minHeight: '72px' }}
      />
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-xs text-red-500">{error}</span>
        <button
          onClick={submit}
          disabled={!value.trim() || saving}
          className="text-xs px-3 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-30 hover:opacity-80 transition"
        >
          {saving ? 'Saving…' : 'Save  ⌘↵'}
        </button>
      </div>
    </div>
  )
}
