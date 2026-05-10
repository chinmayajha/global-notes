'use client'

import { useState } from 'react'
import type { ExtractedTask } from '@global-notes/shared'

interface Props {
  tasks: ExtractedTask[]
  onTaskToggled: (taskId: string, completed: boolean) => void
}

export function ExtractedTasks({ tasks, onTaskToggled }: Props) {
  const [expanded, setExpanded] = useState(false)
  const VISIBLE = 2

  if (tasks.length === 0) return null

  const visible = expanded ? tasks : tasks.slice(0, VISIBLE)
  const hiddenCount = tasks.length - VISIBLE

  const toggle = async (task: ExtractedTask) => {
    const next = !task.completed
    // Optimistic update via parent callback
    onTaskToggled(task.id, next)

    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: next }),
    }).catch(() => {
      // Revert on error
      onTaskToggled(task.id, task.completed)
    })
  }

  return (
    <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
      {visible.map(task => (
        <li key={task.id} className="flex items-start gap-2">
          <button
            onClick={() => toggle(task)}
            className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
              task.completed
                ? 'bg-neutral-400 dark:bg-neutral-600 border-neutral-400 dark:border-neutral-600'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {task.completed && (
              <svg viewBox="0 0 8 6" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 3l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className={`text-xs leading-relaxed ${task.completed ? 'line-through text-neutral-400 dark:text-neutral-600' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {task.task_text}
            {task.due_date && (
              <span className="ml-1.5 text-neutral-400 dark:text-neutral-600">{task.due_date}</span>
            )}
          </span>
        </li>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-left text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
        >
          +{hiddenCount} more task{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
    </ul>
  )
}
