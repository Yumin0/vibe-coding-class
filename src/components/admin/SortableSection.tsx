'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SortableTodoItem from './SortableTodoItem'

type TodoTemplate = {
  id: number
  title: string
  subtitle: string | null
  is_required: boolean
  unlock_after: number | null
  position: number
}

type Section = {
  id: number
  column_type: 'input' | 'progress' | 'output'
  title: string
  position: number
  todo_templates: TodoTemplate[]
}

type Props = {
  section: Section
  onDeleteRequest: (id: number, title: string) => void
  onTitleSave: (id: number, title: string) => void
  onAddTodo: (sectionId: number, title: string) => Promise<void>
  onTodoTitleSave: (id: number, title: string) => void
  onDeleteTodoRequest: (id: number, title: string) => void
  onEditTodoRequest: (id: number) => void
  isDragOverlay?: boolean
}

export default function SortableSection({
  section,
  onDeleteRequest,
  onTitleSave,
  onAddTodo,
  onTodoTitleSave,
  onDeleteTodoRequest,
  onEditTodoRequest,
  isDragOverlay = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(section.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const [addingTodo, setAddingTodo] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [addingLoading, setAddingLoading] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `s-${section.id}`,
    data: { type: 'section' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const todoIds = section.todo_templates.map(t => `t-${t.id}`)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (addingTodo) addInputRef.current?.focus()
  }, [addingTodo])

  const commitTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== section.title) {
      onTitleSave(section.id, trimmed)
    } else {
      setTitleValue(section.title)
    }
    setEditing(false)
  }

  const commitAddTodo = async () => {
    const trimmed = newTodoTitle.trim()
    if (!trimmed || addingLoading) return
    setAddingLoading(true)
    await onAddTodo(section.id, trimmed)
    setNewTodoTitle('')
    setAddingLoading(false)
    setAddingTodo(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={['flex flex-col gap-2', isDragging && !isDragOverlay ? 'opacity-40' : ''].join(' ')}
    >
      {/* Sub-group header */}
      <div className="flex items-center justify-between group px-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 rounded"
            title="拖曳排序"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <circle cx="7"  cy="5"  r="1.5" />
              <circle cx="13" cy="5"  r="1.5" />
              <circle cx="7"  cy="10" r="1.5" />
              <circle cx="13" cy="10" r="1.5" />
              <circle cx="7"  cy="15" r="1.5" />
              <circle cx="13" cy="15" r="1.5" />
            </svg>
          </button>

          {editing ? (
            <input
              ref={inputRef}
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') { setTitleValue(section.title); setEditing(false) }
              }}
              className="text-sm font-bold bg-transparent border-b border-gray-300 outline-none flex-1 min-w-0 text-gray-900"
            />
          ) : (
            <span
              className="text-sm font-bold text-gray-900 cursor-text hover:text-gray-600 truncate"
              onClick={() => setEditing(true)}
              title="點擊編輯標題"
            >
              {section.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-300">{section.todo_templates.length} 項</span>
          <button
            onClick={() => onDeleteRequest(section.id, section.title)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all rounded"
            title="刪除子群組"
          >
            <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Todo list */}
      <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-8">
          {section.todo_templates.map(todo => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              sectionId={section.id}
              onTitleSave={onTodoTitleSave}
              onDeleteRequest={onDeleteTodoRequest}
              onEditRequest={onEditTodoRequest}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add todo row */}
      {!isDragOverlay && (
        addingTodo ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl bg-white">
            <input
              ref={addInputRef}
              value={newTodoTitle}
              onChange={e => setNewTodoTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAddTodo()
                if (e.key === 'Escape') { setNewTodoTitle(''); setAddingTodo(false) }
              }}
              placeholder="Todo 標題"
              className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
              disabled={addingLoading}
            />
            <button
              onClick={commitAddTodo}
              disabled={addingLoading || !newTodoTitle.trim()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 px-1"
            >
              新增
            </button>
            <button
              onClick={() => { setNewTodoTitle(''); setAddingTodo(false) }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTodo(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1 py-1"
          >
            <span className="text-base leading-none">+</span> 新增 Todo
          </button>
        )
      )}
    </div>
  )
}
