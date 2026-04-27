'use client'

import type { Tag } from '@global-notes/shared'

interface Props {
  tags: Tag[]
  active: string | null
  onSelect: (tag: string | null) => void
}

export function TagFilter({ tags, active, onSelect }: Props) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-2.5 py-1 rounded-full border transition ${!active ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'}`}
      >
        All
      </button>
      {tags.map(tag => (
        <button
          key={tag.id}
          onClick={() => onSelect(active === tag.name ? null : tag.name)}
          className={`text-xs px-2.5 py-1 rounded-full border transition ${active === tag.name ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'}`}
        >
          #{tag.name}
          <span className="ml-1 opacity-50">{tag.count}</span>
        </button>
      ))}
    </div>
  )
}
