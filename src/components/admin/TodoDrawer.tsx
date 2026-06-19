'use client'

import { useState, useEffect } from 'react'

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
  title: string
  todo_templates: TodoTemplate[]
}

type TodoUpdates = {
  title: string
  subtitle: string
  description: string
  is_required: boolean
  unlock_after: number | null
}

type Props = {
  todo: TodoTemplate
  sections: Section[]
  onClose: () => void
  onSave: (id: number, updates: TodoUpdates) => Promise<void>
}

export default function TodoDrawer({ todo, sections, onClose, onSave }: Props) {
  const [title, setTitle] = useState(todo.title)
  const [subtitle, setSubtitle] = useState(todo.subtitle ?? '')
  const [description, setDescription] = useState(todo.description ?? '')
  const [isRequired, setIsRequired] = useState(todo.is_required)
  const [unlockAfter, setUnlockAfter] = useState<number | null>(todo.unlock_after)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const otherTodos = sections
    .map(s => ({ section: s, todos: s.todo_templates.filter(t => t.id !== todo.id) }))
    .filter(g => g.todos.length > 0)

  const handleSave = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    await onSave(todo.id, {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      is_required: isRequired,
      unlock_after: unlockAfter,
    })
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">編輯 Todo</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">標題 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Todo 標題"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">副標題</label>
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="簡短說明（顯示在標題下方）"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">詳細描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              placeholder="詳細說明這個 todo 要做什麼..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">前置條件（unlock_after）</label>
            <select
              value={unlockAfter ?? ''}
              onChange={e => setUnlockAfter(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            >
              <option value="">無前置條件</option>
              {otherTodos.map(({ section, todos }) => (
                <optgroup key={section.id} label={section.title}>
                  {todos.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">學生需先完成該項目才能解鎖此 Todo</p>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">必填項目</p>
              <p className="text-xs text-gray-400 mt-0.5">關閉後此 Todo 為選填</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRequired(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isRequired ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isRequired ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </>
  )
}
