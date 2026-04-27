'use client'

import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  // '/' key focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== ref.current) {
        e.preventDefault()
        ref.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === ref.current) {
        onChange('')
        ref.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onChange])

  return (
    <div className="relative">
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search  /"
        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  )
}
