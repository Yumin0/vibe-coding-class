'use client'

import { useState, useEffect, useCallback } from 'react'

type TodoDetail = {
  todoId: number
  title: string
  sectionId: number
  sectionTitle: string
  sectionPosition: number
  columnType: string
  todoPosition: number
  status: 'done' | 'pending'
}

type StudentProgress = {
  enrollmentId: number
  student: { id: string; name: string; avatarUrl: string | null }
  totalTodos: number
  completedTodos: number
  todos: TodoDetail[]
}

type FilterKey = 'all' | 'behind' | 'normal' | 'completed'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: '全部' },
  { key: 'behind',    label: '進度落後' },
  { key: 'normal',    label: '正常' },
  { key: 'completed', label: '已完成' },
]

function getFilterKey(completed: number, total: number): FilterKey {
  if (total === 0 || completed === total) return 'completed'
  if (completed / total < 0.5) return 'behind'
  return 'normal'
}

export default function StudentProgressPanel({ cohortId }: { cohortId: number }) {
  const [students, setStudents] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<StudentProgress | null>(null)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/cohorts/${cohortId}/progress`)
    if (res.ok) setStudents(await res.json())
    setLoading(false)
  }, [cohortId])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  const counts: Record<FilterKey, number> = {
    all: students.length,
    behind:    students.filter(s => getFilterKey(s.completedTodos, s.totalTodos) === 'behind').length,
    normal:    students.filter(s => getFilterKey(s.completedTodos, s.totalTodos) === 'normal').length,
    completed: students.filter(s => getFilterKey(s.completedTodos, s.totalTodos) === 'completed').length,
  }

  const filtered = filter === 'all'
    ? students
    : students.filter(s => getFilterKey(s.completedTodos, s.totalTodos) === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-gray-400' : 'text-gray-400'}`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">載入中...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">此班級尚無學生</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">無符合條件的學生</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">學生</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">進度</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 w-20">完成度</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => {
                const pct = s.totalTodos > 0 ? Math.round((s.completedTodos / s.totalTodos) * 100) : 0
                const key = getFilterKey(s.completedTodos, s.totalTodos)
                return (
                  <tr
                    key={s.enrollmentId}
                    onClick={() => setSelected(s)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{s.student.name}</p>
                      {key === 'completed' && (
                        <span className="text-xs text-green-600 font-medium">已完成</span>
                      )}
                      {key === 'behind' && (
                        <span className="text-xs text-amber-500 font-medium">進度落後</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-36 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{s.completedTodos}/{s.totalTodos}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${
                        pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-blue-600' : 'text-amber-500'
                      }`}>{pct}%</span>
                    </td>
                    <td className="pr-4 text-gray-300">›</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setSelected(null)}
          />
          <div className="w-[480px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900">{selected.student.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  完成 {selected.completedTodos}/{selected.totalTodos} 項（
                  {selected.totalTodos > 0
                    ? Math.round((selected.completedTodos / selected.totalTodos) * 100)
                    : 0}%）
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {groupBySections(selected.todos).map(section => (
                <div key={section.sectionId}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.sectionTitle}
                  </h3>
                  <div className="space-y-1.5">
                    {section.todos.map(todo => (
                      <div
                        key={todo.todoId}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                          todo.status === 'done'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          todo.status === 'done'
                            ? 'bg-green-500 text-white'
                            : 'border-2 border-gray-300'
                        }`}>
                          {todo.status === 'done' && '✓'}
                        </span>
                        <span className={todo.status === 'done' ? 'text-green-800' : 'text-gray-500'}>
                          {todo.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function groupBySections(todos: TodoDetail[]) {
  const map = new Map<number, { sectionId: number; sectionTitle: string; sectionPosition: number; todos: TodoDetail[] }>()
  for (const todo of todos) {
    if (!map.has(todo.sectionId)) {
      map.set(todo.sectionId, {
        sectionId: todo.sectionId,
        sectionTitle: todo.sectionTitle,
        sectionPosition: todo.sectionPosition,
        todos: [],
      })
    }
    map.get(todo.sectionId)!.todos.push(todo)
  }
  return [...map.values()]
    .sort((a, b) => a.sectionPosition - b.sectionPosition)
    .map(s => ({
      ...s,
      todos: s.todos.slice().sort((a, b) => a.todoPosition - b.todoPosition),
    }))
}
