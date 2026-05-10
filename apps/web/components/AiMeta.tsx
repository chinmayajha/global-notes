'use client'

import type { Note } from '@global-notes/shared'

const TYPE_COLORS: Record<string, string> = {
  task:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  research:  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  coding:    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  debugging: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  idea:      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  meeting:   'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  journal:   'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  learning:  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  finance:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  reminder:  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  planning:  'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
}

interface Props {
  note: Pick<Note, 'ai_note_type' | 'ai_project' | 'ai_confidence' | 'ai_processed_at'>
}

export function AiMeta({ note }: Props) {
  if (!note.ai_processed_at) return null

  const typeColor = note.ai_note_type ? (TYPE_COLORS[note.ai_note_type] ?? TYPE_COLORS.journal) : null
  const confidence = note.ai_confidence != null ? Math.round(note.ai_confidence * 100) : null

  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      {note.ai_note_type && typeColor && (
        <span
          title={confidence != null ? `AI: ${note.ai_note_type} · ${confidence}% confidence` : `AI: ${note.ai_note_type}`}
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium leading-none cursor-default ${typeColor}`}
        >
          {note.ai_note_type}
        </span>
      )}
      {note.ai_project && (
        <span
          title={`Project: ${note.ai_project}`}
          className="text-[10px] text-neutral-500 dark:text-neutral-500 leading-none cursor-default"
        >
          ◈ {note.ai_project}
        </span>
      )}
    </span>
  )
}
