'use client'

import { useState, useEffect } from 'react'
import type { Note, ExtractedTask } from '@global-notes/shared'

interface AiTask extends ExtractedTask {
  note_content?: string
}

function todayKey() {
  return `morning-dismissed-${new Date().toISOString().slice(0, 10)}`
}

export function MorningView() {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash
  const [urgentNotes, setUrgentNotes] = useState<Note[]>([])
  const [pendingTasks, setPendingTasks] = useState<AiTask[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    if (hour < 5 || hour >= 12) return

    const key = todayKey()
    if (localStorage.getItem(key)) return

    setDismissed(false)
    setLoading(true)

    Promise.all([
      fetch('/api/notes?min_urgency=0.65&limit=5').then(r => r.ok ? r.json() : null),
      fetch('/api/tasks?completed=false&limit=10').then(r => r.ok ? r.json() : null),
    ]).then(([notesData, tasksData]) => {
      if (notesData?.notes) setUrgentNotes(notesData.notes)
      if (Array.isArray(tasksData)) setPendingTasks(tasksData)
    }).finally(() => setLoading(false))
  }, [])

  const dismiss = () => {
    localStorage.setItem(todayKey(), '1')
    setDismissed(true)
  }

  if (!mounted || dismissed) return null
  if (loading) return null
  if (urgentNotes.length === 0 && pendingTasks.length === 0) return null

  const hour = new Date().getHours()
  const greeting = hour < 9 ? 'Good morning' : hour < 12 ? 'Morning' : null
  if (!greeting) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{greeting} · here's what needs attention</span>
        <button
          onClick={dismiss}
          className="text-[11px] text-amber-500 dark:text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 transition"
        >
          dismiss
        </button>
      </div>

      {urgentNotes.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-amber-600 dark:text-amber-500 mb-1.5 font-medium uppercase tracking-wide">Urgent</p>
          <ul className="flex flex-col gap-1.5">
            {urgentNotes.map(n => (
              <li key={n.id} className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-2">
                {n.ai_summary ?? n.content.slice(0, 120)}
                {n.ai_project && (
                  <span className="ml-1.5 text-[10px] text-neutral-400 dark:text-neutral-600">◈ {n.ai_project}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div>
          <p className="text-[11px] text-amber-600 dark:text-amber-500 mb-1.5 font-medium uppercase tracking-wide">Pending tasks</p>
          <ul className="flex flex-col gap-1">
            {pendingTasks.map(t => (
              <li key={t.id} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0 w-3 h-3 rounded border border-amber-300 dark:border-amber-700" />
                <span className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {t.task_text}
                  {t.due_date && (
                    <span className="ml-1.5 text-neutral-400 dark:text-neutral-600">{t.due_date}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
