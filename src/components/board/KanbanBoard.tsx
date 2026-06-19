'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TodoItem from './TodoItem'

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
  enrollmentId: number
  sections: Section[]
  initialProgress: Record<number, 'pending' | 'done'>
}

const COLUMN_ORDER = ['input', 'progress', 'output'] as const
type ColumnType = typeof COLUMN_ORDER[number]

const COLUMN_META: Record<ColumnType, { label: string; dotClass: string; countClass: string }> = {
  input:    { label: 'Input',    dotClass: 'bg-gray-400',    countClass: 'text-gray-400' },
  progress: { label: 'Progress', dotClass: 'bg-gray-400',    countClass: 'text-gray-400' },
  output:   { label: 'Output',   dotClass: 'bg-[#D98324]',   countClass: 'text-[#D98324]' },
}

export default function KanbanBoard({ enrollmentId, sections, initialProgress }: Props) {
  const [progress, setProgress] = useState(initialProgress)
  const supabase = createClient()

  async function toggleTodo(todoId: number, done: boolean) {
    const prev = progress[todoId]
    setProgress(p => ({ ...p, [todoId]: done ? 'done' : 'pending' }))

    const { error } = await supabase.from('todo_progress').upsert(
      {
        enrollment_id: enrollmentId,
        todo_template_id: todoId,
        status: done ? 'done' : 'pending',
        completed_at: done ? new Date().toISOString() : null,
      },
      { onConflict: 'enrollment_id,todo_template_id' }
    )

    if (error) {
      setProgress(p => ({ ...p, [todoId]: prev ?? 'pending' }))
    }
  }

  const sorted = [...sections].sort((a, b) => a.position - b.position)

  const allTodos = sections.flatMap(s => s.todo_templates)
  const totalTodos = allTodos.length
  const totalDone = allTodos.filter(t => progress[t.id] === 'done').length
  const progressPct = totalTodos > 0 ? (totalDone / totalTodos) * 100 : 0

  return (
    <>
      {/* 本期進度 strip */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">本期進度</span>
        <div className="flex-1 h-[7px] rounded-full bg-[#ECE8E3]">
          <div
            className="h-[7px] rounded-full bg-[#D98324] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-medium text-[#D98324] tabular-nums whitespace-nowrap">
          {totalDone} / {totalTodos} 完成
        </span>
      </div>
      <div className="border-b border-[#ECE8E3] mb-10" />

      {/* Kanban grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
        {COLUMN_ORDER.map(colType => {
          const colSections = sorted.filter(s => s.column_type === colType)
          const meta = COLUMN_META[colType]
          const colTodos = colSections.flatMap(s => s.todo_templates)
          const doneCount = colTodos.filter(t => progress[t.id] === 'done').length

          return (
            <div key={colType} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE8E3]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                  <h3 className="font-bold text-sm text-gray-900">{meta.label}</h3>
                </div>
                <span className={`text-sm font-medium tabular-nums ${meta.countClass}`}>
                  {doneCount}/{colTodos.length}
                </span>
              </div>

              {/* Section sub-groups */}
              <div className="flex flex-col mt-6 gap-8">
                {colSections.map(section => {
                  const todos = [...section.todo_templates].sort((a, b) => a.position - b.position)
                  return (
                    <div key={section.id}>
                      <p className="text-[12px] font-bold tracking-wider text-[#64615E] mb-3 px-2">
                        {section.title}
                      </p>
                      <div className="flex flex-col">
                        {todos.map(todo => {
                          const isDone = progress[todo.id] === 'done'
                          const isLocked = todo.unlock_after !== null && progress[todo.unlock_after] !== 'done'
                          return (
                            <TodoItem
                              key={todo.id}
                              todo={todo}
                              isDone={isDone}
                              isLocked={isLocked}
                              onToggle={toggleTodo}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
