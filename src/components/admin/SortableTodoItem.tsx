'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type TodoTemplate = {
  id: number
  title: string
  subtitle: string | null
  is_required: boolean
  unlock_after: number | null
  position: number
}

type Props = {
  todo: TodoTemplate
  sectionId: number
  isDragOverlay?: boolean
  onTitleSave?: (id: number, title: string) => void
  onDeleteRequest?: (id: number, title: string) => void
  onEditRequest?: (id: number) => void
}

export default function SortableTodoItem({
  todo,
  sectionId,
  isDragOverlay = false,
  onTitleSave,
  onDeleteRequest,
  onEditRequest,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(todo.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `t-${todo.id}`,
    data: { type: 'todo', sectionId },
  })

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commitTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== todo.title) {
      onTitleSave?.(todo.id, trimmed)
    } else {
      setTitleValue(todo.title)
    }
    setEditing(false)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white select-none',
        isDragging && !isDragOverlay ? 'opacity-40 border-dashed' : '',
        isDragOverlay ? 'shadow-lg rotate-1 cursor-grabbing' : 'hover:border-gray-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing"
        tabIndex={-1}
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
          <circle cx="7"  cy="5"  r="1.5" />
          <circle cx="13" cy="5"  r="1.5" />
          <circle cx="7"  cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7"  cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-200" />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setTitleValue(todo.title); setEditing(false) }
            }}
            className="w-full text-sm font-medium text-gray-800 bg-transparent border-b border-gray-400 outline-none leading-snug"
          />
        ) : (
          <p
            className="text-sm font-medium text-gray-800 leading-snug cursor-text hover:text-gray-600"
            onClick={() => !isDragOverlay && setEditing(true)}
            title="點擊編輯標題"
          >
            {todo.title}
          </p>
        )}
        {todo.subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{todo.subtitle}</p>
        )}
        {todo.unlock_after !== null && (
          <p className="text-xs text-gray-400 mt-1">🔒 有前置條件</p>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      {!isDragOverlay && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEditRequest?.(todo.id)}
            className="p-1.5 text-gray-300 hover:text-blue-500 rounded transition-colors"
            title="編輯詳細"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteRequest?.(todo.id, todo.title)}
            className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
            title="刪除"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
