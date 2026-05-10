'use client'

import { useState } from 'react'
import type { Tag } from '@global-notes/shared'

interface Props {
  tags: Tag[]
  active: string | null
  onSelect: (tag: string | null) => void
  onDelete: (tag: string) => void
}

export function TagFilter({ tags, active, onSelect, onDelete }: Props) {
  const [confirm, setConfirm] = useState<string | null>(null)

  if (tags.length === 0) return null

  const handleDelete = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation()
    if (confirm === tagName) {
      onDelete(tagName)
      setConfirm(null)
    } else {
      setConfirm(tagName)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => { onSelect(null); setConfirm(null) }}
        className={`text-xs px-2.5 py-1 rounded-full border transition ${!active ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'}`}
      >
        All
      </button>
      {tags.map(tag => (
        <span key={tag.id} className="group relative inline-flex">
          <button
            onClick={() => { onSelect(active === tag.name ? null : tag.name); setConfirm(null) }}
            onBlur={() => setConfirm(null)}
            className={`text-xs pl-2.5 pr-6 py-1 rounded-full border transition ${active === tag.name ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'}`}
          >
            #{tag.name}
            <span className="ml-1 opacity-50">{tag.count}</span>
          </button>

          {/* Delete button — visible on group hover */}
          <button
            onClick={(e) => handleDelete(e, tag.name)}
            title={confirm === tag.name ? 'Click again to confirm' : 'Delete tag'}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[9px] leading-none opacity-0 group-hover:opacity-100 transition-opacity ${
              confirm === tag.name
                ? 'bg-red-500 text-white opacity-100'
                : active === tag.name
                  ? 'bg-white/30 text-white hover:bg-white/50'
                  : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-red-400 hover:text-white'
            }`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
