'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Cohort = {
  id: number
  title: string
  status: string
  starts_at: string | null
  ends_at: string | null
  studentCount: number
  templateTitle: string | null
  templateId: number | null
}

type Template = {
  id: number
  title: string
}

type Props = {
  cohorts: Cohort[]
  templates: Template[]
}

const statusLabel: Record<string, { text: string; className: string }> = {
  draft:  { text: '草稿',   className: 'bg-gray-100 text-gray-600' },
  active: { text: '進行中', className: 'bg-green-100 text-green-700' },
  ended:  { text: '已結束', className: 'bg-gray-100 text-gray-400' },
}

export default function AdminCohortList({ cohorts, templates }: Props) {
  const router = useRouter()

  // new cohort modal
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTemplateId, setNewTemplateId] = useState<number | ''>(templates[0]?.id ?? '')
  const [creating, setCreating] = useState(false)

  // fork modal
  const [forkSource, setForkSource] = useState<Cohort | null>(null)
  const [forkTitle, setForkTitle] = useState('')
  const [forking, setForking] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    const res = await fetch('/api/cohorts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), template_id: newTemplateId || null }),
    })
    setCreating(false)
    if (res.ok) {
      const data = await res.json()
      setShowNew(false)
      setNewTitle('')
      router.push(`/admin/cohorts/${data.id}`)
    }
  }

  const handleFork = async () => {
    if (!forkSource || !forkTitle.trim() || forking) return
    setForking(true)
    const res = await fetch(`/api/cohorts/${forkSource.id}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: forkTitle.trim() }),
    })
    setForking(false)
    if (res.ok) {
      const data = await res.json()
      setForkSource(null)
      setForkTitle('')
      router.push(`/admin/cohorts/${data.id}`)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">班級列表</h2>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          + 新增班級
        </button>
      </div>

      {cohorts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">目前沒有班級</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cohorts.map(cohort => {
            const status = statusLabel[cohort.status] ?? statusLabel.draft
            return (
              <div key={cohort.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all">
                <Link href={`/admin/cohorts/${cohort.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                      {status.text}
                    </span>
                    {cohort.templateTitle && (
                      <span className="text-xs text-gray-400">{cohort.templateTitle}</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{cohort.title}</h3>
                  {cohort.starts_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      {cohort.starts_at} {cohort.ends_at ? `~ ${cohort.ends_at}` : '起'}
                    </p>
                  )}
                </Link>

                <div className="flex items-center gap-4 flex-shrink-0 ml-6">
                  <button
                    onClick={() => { setForkSource(cohort); setForkTitle(`${cohort.title}（副本）`) }}
                    className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Fork
                  </button>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{cohort.studentCount}</p>
                    <p className="text-xs text-gray-400">學生</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 新增班級 Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 mb-4">新增班級</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">班級名稱 *</label>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false) }}
                  placeholder="例：2026 Q3 初階班"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">課程母版</label>
                  <select
                    value={newTemplateId}
                    onChange={e => setNewTemplateId(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
                  >
                    <option value="">不選</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setShowNew(false); setNewTitle('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {creating ? '建立中...' : '建立'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fork Modal */}
      {forkSource && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 mb-1">Fork 班級</h3>
            <p className="text-xs text-gray-400 mb-4">複製「{forkSource.title}」的所有 sections 和 todos</p>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">新班級名稱 *</label>
              <input
                autoFocus
                value={forkTitle}
                onChange={e => setForkTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleFork(); if (e.key === 'Escape') setForkSource(null) }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setForkSource(null); setForkTitle('') }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleFork}
                disabled={!forkTitle.trim() || forking}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {forking ? 'Fork 中...' : 'Fork'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
