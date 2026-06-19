'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import SortableSection from './SortableSection'
import SortableTodoItem from './SortableTodoItem'
import TodoDrawer from './TodoDrawer'

type TodoTemplate = {
  id: number
  title: string
  subtitle: string | null
  description: string | null
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

type ActiveItem =
  | { type: 'section'; section: Section }
  | { type: 'todo'; todo: TodoTemplate; sectionId: number }

type DeleteTarget = { id: number; title: string; kind: 'section' | 'todo'; sectionId?: number }

type Props = {
  cohortId: number
  initialSections: Section[]
}

const COLUMN_ORDER = ['input', 'progress', 'output'] as const
type ColumnType = typeof COLUMN_ORDER[number]

const COLUMN_META: Record<ColumnType, { label: string; dot: string; header: string }> = {
  input:    { label: 'Input',    dot: 'bg-blue-400',   header: 'text-blue-700' },
  progress: { label: 'Progress', dot: 'bg-purple-400', header: 'text-purple-700' },
  output:   { label: 'Output',   dot: 'bg-green-400',  header: 'text-green-700' },
}

// --- ID helpers ---
const sid = (id: number) => `s-${id}` as UniqueIdentifier
const tid = (id: number) => `t-${id}` as UniqueIdentifier
const isS = (id: UniqueIdentifier) => String(id).startsWith('s-')
const isT = (id: UniqueIdentifier) => String(id).startsWith('t-')
const parseSid = (id: UniqueIdentifier) => parseInt(String(id).slice(2))
const parseTid = (id: UniqueIdentifier) => parseInt(String(id).slice(2))

// --- API helpers ---
async function apiFetch(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) console.error(`${method} ${url} failed`, await res.text())
}

export default function KanbanEditor({ cohortId, initialSections }: Props) {
  const [sections, setSections] = useState<Section[]>(
    [...initialSections].sort((a, b) => a.position - b.position)
  )
  const sectionsRef = useRef<Section[]>(sections)

  const updateSections = (next: Section[] | ((prev: Section[]) => Section[])) => {
    setSections(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      sectionsRef.current = resolved
      return resolved
    })
  }

  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [showAddSection, setShowAddSection] = useState<ColumnType | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [editingTodo, setEditingTodo] = useState<TodoTemplate | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const findTodoSection = (todoId: number): Section | undefined =>
    sectionsRef.current.find(s => s.todo_templates.some(t => t.id === todoId))

  const findOverSection = (overId: UniqueIdentifier): Section | undefined => {
    if (isS(overId)) return sectionsRef.current.find(s => s.id === parseSid(overId))
    if (isT(overId)) return sectionsRef.current.find(s => s.todo_templates.some(t => t.id === parseTid(overId)))
    return undefined
  }

  // --- Drag handlers ---

  const handleDragStart = ({ active }: DragStartEvent) => {
    const cur = sectionsRef.current
    if (isS(active.id)) {
      const section = cur.find(s => s.id === parseSid(active.id))
      if (section) setActiveItem({ type: 'section', section })
    } else {
      const todoId = parseTid(active.id)
      for (const section of cur) {
        const todo = section.todo_templates.find(t => t.id === todoId)
        if (todo) { setActiveItem({ type: 'todo', todo, sectionId: section.id }); break }
      }
    }
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || isS(active.id)) return

    const todoId = parseTid(active.id)
    const activeSection = findTodoSection(todoId)
    const overSection = findOverSection(over.id)

    if (!activeSection || !overSection || activeSection.id === overSection.id) return

    let insertIdx = overSection.todo_templates.length
    if (isT(over.id)) {
      const overIdx = overSection.todo_templates.findIndex(t => t.id === parseTid(over.id))
      if (overIdx >= 0) insertIdx = overIdx
    }

    updateSections(prev => {
      const todo = prev.find(s => s.id === activeSection.id)!.todo_templates.find(t => t.id === todoId)!
      return prev.map(s => {
        if (s.id === activeSection.id) return { ...s, todo_templates: s.todo_templates.filter(t => t.id !== todoId) }
        if (s.id === overSection.id) {
          const next = [...s.todo_templates]
          next.splice(insertIdx, 0, todo)
          return { ...s, todo_templates: next }
        }
        return s
      })
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItem(null)
    if (!over) return

    const cur = sectionsRef.current

    if (isS(active.id) && isS(over.id)) {
      const activeSection = cur.find(s => s.id === parseSid(active.id))
      const overSection   = cur.find(s => s.id === parseSid(over.id))
      if (!activeSection || !overSection) return
      // Only allow reorder within the same column
      if (activeSection.column_type !== overSection.column_type) return

      const colSections = cur
        .filter(s => s.column_type === activeSection.column_type)
        .sort((a, b) => a.position - b.position)
      const fromIdx = colSections.findIndex(s => s.id === activeSection.id)
      const toIdx   = colSections.findIndex(s => s.id === overSection.id)
      if (fromIdx === toIdx) return

      const reordered = arrayMove(colSections, fromIdx, toIdx).map((s, i) => ({ ...s, position: i }))
      updateSections(prev => prev.map(s => reordered.find(r => r.id === s.id) ?? s))
      apiFetch('/api/sections/reorder', 'POST', {
        updates: reordered.map(s => ({ id: s.id, position: s.position })),
      })
      return
    }

    if (isT(active.id)) {
      const todoId = parseTid(active.id)
      let next = cur

      if (isT(over.id)) {
        const overTodoId = parseTid(over.id)
        const activeSec = cur.find(s => s.todo_templates.some(t => t.id === todoId))
        const overSec   = cur.find(s => s.todo_templates.some(t => t.id === overTodoId))

        if (activeSec && overSec && activeSec.id === overSec.id) {
          const fromIdx = activeSec.todo_templates.findIndex(t => t.id === todoId)
          const toIdx   = activeSec.todo_templates.findIndex(t => t.id === overTodoId)
          if (fromIdx !== toIdx) {
            const newTodos = arrayMove(activeSec.todo_templates, fromIdx, toIdx)
            next = cur.map(s => s.id === activeSec.id ? { ...s, todo_templates: newTodos } : s)
          }
        }
      }

      const withPositions = next.map(s => ({
        ...s,
        todo_templates: s.todo_templates.map((t, i) => ({ ...t, position: i })),
      }))
      updateSections(withPositions)
      apiFetch('/api/todo-templates/reorder', 'POST', {
        updates: withPositions.flatMap(s =>
          s.todo_templates.map(t => ({ id: t.id, position: t.position, section_id: s.id }))
        ),
      })
    }
  }

  // --- CRUD handlers ---

  const handleTitleSave = async (sectionId: number, title: string) => {
    updateSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s))
    await apiFetch(`/api/sections/${sectionId}`, 'PATCH', { title })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { id, kind, sectionId } = deleteTarget
    setDeleteTarget(null)

    if (kind === 'section') {
      updateSections(prev => prev.filter(s => s.id !== id))
      await apiFetch(`/api/sections/${id}`, 'DELETE')
    } else {
      updateSections(prev => prev.map(s =>
        s.id === sectionId
          ? { ...s, todo_templates: s.todo_templates.filter(t => t.id !== id) }
          : s
      ))
      await apiFetch(`/api/todo-templates/${id}`, 'DELETE')
    }
  }

  const handleAddTodo = async (sectionId: number, title: string) => {
    const res = await fetch('/api/todo-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_id: sectionId, title }),
    })
    if (!res.ok) return
    const newTodo = await res.json()
    updateSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, todo_templates: [...s.todo_templates, newTodo] }
        : s
    ))
  }

  const handleTodoTitleSave = async (todoId: number, title: string) => {
    for (const s of sectionsRef.current) {
      const todo = s.todo_templates.find(t => t.id === todoId)
      if (todo) {
        await handleSaveTodo(todoId, {
          title,
          subtitle: todo.subtitle ?? '',
          description: todo.description ?? '',
          is_required: todo.is_required,
          unlock_after: todo.unlock_after,
        })
        return
      }
    }
  }

  const handleEditTodo = (todoId: number) => {
    for (const s of sectionsRef.current) {
      const todo = s.todo_templates.find(t => t.id === todoId)
      if (todo) { setEditingTodo(todo); return }
    }
  }

  const handleSaveTodo = async (id: number, updates: {
    title: string; subtitle: string; description: string; is_required: boolean; unlock_after: number | null
  }) => {
    const res = await fetch(`/api/todo-templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return
    const updated: TodoTemplate = await res.json()
    updateSections(prev => prev.map(s => ({
      ...s,
      todo_templates: s.todo_templates.map(t => t.id === id ? { ...t, ...updated } : t),
    })))
  }

  const handleAddSection = async (colType: ColumnType) => {
    const title = newSectionTitle.trim()
    if (!title) return

    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortId, title, column_type: colType }),
    })
    if (!res.ok) return

    const newSection: Section = await res.json()
    updateSections(prev => [...prev, newSection])
    setNewSectionTitle('')
    setShowAddSection(null)
  }

  // Overlay content
  const overlaySection = activeItem?.type === 'section'
    ? sections.find(s => s.id === activeItem.section.id) ?? null
    : null
  const overlayTodo = activeItem?.type === 'todo'
    ? (() => {
        for (const s of sections) {
          const t = s.todo_templates.find(t => t.id === activeItem.todo.id)
          if (t) return { todo: t, sectionId: s.id }
        }
        return null
      })()
    : null

  return (
    <div>
      <DndContext
        id="kanban-editor"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-6">
          {COLUMN_ORDER.map(colType => {
            const meta = COLUMN_META[colType]
            const colSections = sections
              .filter(s => s.column_type === colType)
              .sort((a, b) => a.position - b.position)
            const colSectionIds = colSections.map(s => sid(s.id))

            return (
              <div key={colType} className="flex flex-col gap-4">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <h3 className={`font-semibold text-sm ${meta.header}`}>{meta.label}</h3>
                  <span className="text-xs text-gray-400 ml-auto">
                    {colSections.reduce((n, s) => n + s.todo_templates.length, 0)} 項
                  </span>
                </div>

                {/* Sections as sub-groups */}
                <SortableContext items={colSectionIds} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4">
                    {colSections.map(section => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onDeleteRequest={(id, title) => setDeleteTarget({ id, title, kind: 'section' })}
                        onTitleSave={handleTitleSave}
                        onAddTodo={handleAddTodo}
                        onTodoTitleSave={handleTodoTitleSave}
                        onDeleteTodoRequest={(id, title) => setDeleteTarget({ id, title, kind: 'todo', sectionId: section.id })}
                        onEditTodoRequest={handleEditTodo}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Add sub-group for this column */}
                {showAddSection === colType ? (
                  <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-xl bg-white">
                    <input
                      autoFocus
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddSection(colType)
                        if (e.key === 'Escape') { setShowAddSection(null); setNewSectionTitle('') }
                      }}
                      placeholder="子群組名稱"
                      className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={() => handleAddSection(colType)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
                    >
                      新增
                    </button>
                    <button
                      onClick={() => { setShowAddSection(null); setNewSectionTitle('') }}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowAddSection(colType); setNewSectionTitle('') }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="text-sm leading-none">+</span> 新增子群組
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {overlaySection && (
            <SortableSection
              section={overlaySection}
              onDeleteRequest={() => {}}
              onTitleSave={() => {}}
              onAddTodo={async () => {}}
              onTodoTitleSave={() => {}}
              onDeleteTodoRequest={() => {}}
              onEditTodoRequest={() => {}}
              isDragOverlay
            />
          )}
          {overlayTodo && (
            <SortableTodoItem
              todo={overlayTodo.todo}
              sectionId={overlayTodo.sectionId}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Todo edit drawer */}
      {editingTodo && (
        <TodoDrawer
          todo={editingTodo}
          sections={sections}
          onClose={() => setEditingTodo(null)}
          onSave={handleSaveTodo}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {deleteTarget.kind === 'section' ? '刪除子群組' : '刪除 Todo'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              確定要刪除「<span className="font-medium text-gray-800">{deleteTarget.title}</span>」嗎？
              {deleteTarget.kind === 'section'
                ? '此子群組內所有 todo 項目也會一併刪除，無法復原。'
                : '此動作無法復原。'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
