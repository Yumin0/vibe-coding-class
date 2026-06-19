'use client'

type Todo = {
  id: number
  title: string
  subtitle: string | null
  is_required: boolean
  unlock_after: number | null
}

type Props = {
  todo: Todo
  isDone: boolean
  isLocked: boolean
  onToggle: (id: number, done: boolean) => void
}

export default function TodoItem({ todo, isDone, isLocked, onToggle }: Props) {
  return (
    <div
      className={`flex items-center gap-3 px-2 py-2.5 rounded-[14px] transition-colors ${
        isLocked ? 'opacity-40' : 'hover:bg-[#F4F2EF] cursor-pointer'
      }`}
      onClick={() => !isLocked && onToggle(todo.id, !isDone)}
    >
      <button
        onClick={e => { e.stopPropagation(); !isLocked && onToggle(todo.id, !isDone) }}
        disabled={isLocked}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none ${
          isDone
            ? 'bg-[#D98324] border-[#D98324]'
            : isLocked
            ? 'border-[#C9C4BE] cursor-not-allowed'
            : 'border-[#C9C4BE] hover:border-[#D98324] cursor-pointer'
        }`}
      >
        {isDone && (
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <p className={`text-sm leading-snug ${isDone ? 'text-[#A8A29C]' : 'text-gray-800'}`}>
        {todo.title}
      </p>
    </div>
  )
}
