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
  sections: Section[]
}

const COLUMN_ORDER = ['input', 'progress', 'output'] as const
type ColumnType = typeof COLUMN_ORDER[number]

const COLUMN_META: Record<ColumnType, { label: string; dot: string; header: string }> = {
  input:    { label: 'Input',    dot: 'bg-blue-400',   header: 'text-blue-700' },
  progress: { label: 'Progress', dot: 'bg-purple-400', header: 'text-purple-700' },
  output:   { label: 'Output',   dot: 'bg-green-400',  header: 'text-green-700' },
}

export default function KanbanPreview({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">尚無欄位</p>
        <p className="text-sm mt-1">新增欄位後這裡會顯示課程結構</p>
      </div>
    )
  }

  const sorted = [...sections].sort((a, b) => a.position - b.position)

  return (
    <div className="grid grid-cols-3 gap-6">
      {COLUMN_ORDER.map(colType => {
        const colSections = sorted.filter(s => s.column_type === colType)
        const meta = COLUMN_META[colType]
        const totalTodos = colSections.reduce((sum, s) => sum + s.todo_templates.length, 0)

        return (
          <div key={colType} className="flex flex-col gap-4">
            {/* Column header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <h3 className={`font-semibold text-sm ${meta.header}`}>{meta.label}</h3>
              </div>
              <span className="text-xs text-gray-400">{totalTodos} 項</span>
            </div>

            {/* Section sub-groups */}
            {colSections.map(section => {
              const todos = [...section.todo_templates].sort((a, b) => a.position - b.position)
              return (
                <div key={section.id} className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-gray-900 px-1">{section.title}</p>
                  {todos.map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white"
                    >
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{todo.title}</p>
                        {todo.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5">{todo.subtitle}</p>
                        )}
                        {todo.unlock_after !== null && (
                          <p className="text-xs text-gray-400 mt-1">🔒 有前置條件</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
