'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { UserButton } from '@clerk/nextjs'
import { NoteInput } from '@/components/NoteInput'
import { NoteList } from '@/components/NoteList'
import { SearchBar } from '@/components/SearchBar'
import { TagFilter } from '@/components/TagFilter'
import { SettingsPanel } from '@/components/SettingsPanel'
import type { Note, Tag, PaginatedNotes } from '@global-notes/shared'

const PER_PAGE = 25

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSearch = useRef(search)

  const loadTags = useCallback(async () => {
    const res = await fetch('/api/tags')
    if (res.ok) setTags(await res.json())
  }, [])

  const loadNotes = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    const params = new URLSearchParams({ page: String(currentPage), per_page: String(PER_PAGE) })

    let url: string
    if (debouncedSearch.current) {
      url = `/api/notes?q=${encodeURIComponent(debouncedSearch.current)}&${params}`
    } else {
      if (activeTag) params.set('tag', activeTag)
      url = `/api/notes?${params}`
    }

    const res = await fetch(url)
    if (res.ok) {
      const data: PaginatedNotes = await res.json()
      setNotes(prev => reset ? data.notes : [...prev, ...data.notes])
      setHasMore(data.has_more)
      if (!reset) setPage(p => p + 1)
    }
    setLoading(false)
  }, [page, activeTag])

  // Initial load
  useEffect(() => {
    loadTags()
  }, [loadTags])

  // Reload when tag or search changes
  useEffect(() => {
    debouncedSearch.current = search
    setPage(1)
    loadNotes(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag, search])

  // Debounce search input
  const handleSearchChange = useCallback((v: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => setSearch(v), 300)
    // Immediate visual update
    setSearch(v)
  }, [])

  const handleCreated = (note: Note) => {
    setNotes(prev => [note, ...prev.filter(n => !n.pinned || note.pinned)])
    loadTags()
  }

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    loadTags()
  }

  const handleUpdate = (updated: Note) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
    loadTags()
  }

  const handleTagClick = (tag: string) => {
    setActiveTag(prev => prev === tag ? null : tag)
    setSearch('')
  }

  const handleTagDelete = async (tagName: string) => {
    await fetch(`/api/tags/${encodeURIComponent(tagName)}`, { method: 'DELETE' })
    setTags(prev => prev.filter(t => t.name !== tagName))
    // Remove the tag from all visible notes' tag lists
    setNotes(prev => prev.map(n => ({ ...n, tags: n.tags.filter(t => t !== tagName) })))
    if (activeTag === tagName) setActiveTag(null)
  }

  const handleLoadMore = () => {
    loadNotes(false)
  }

  // Global keyboard shortcut: Cmd+, for settings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="font-mono font-bold text-sm tracking-tight select-none">global-notes</span>
          <div className="flex-1">
            <SearchBar value={search} onChange={handleSearchChange} />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings  ⌘,"
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 text-sm transition"
          >
            ⚙️
          </button>
          <UserButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Capture input */}
        <NoteInput onCreated={handleCreated} />

        {/* Tag filter */}
        {!search && (
          <TagFilter
            tags={tags}
            active={activeTag}
            onSelect={tag => { setActiveTag(tag); setSearch('') }}
            onDelete={handleTagDelete}
          />
        )}

        {/* Status line */}
        <div className="text-xs text-neutral-400 dark:text-neutral-600">
          {search
            ? `Results for "${search}"`
            : activeTag
              ? `#${activeTag}`
              : 'All notes'}
        </div>

        {/* Notes */}
        <NoteList
          notes={notes}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onTagClick={handleTagClick}
        />
      </main>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
