'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Cohort = {
  id: number
  title: string
  status: string
  starts_at: string | null
  ends_at: string | null
  max_students: number | null
}

type Enrollment = {
  id: number
  status: string
  enrolled_at: string
  student: { id: string; name: string; email: string } | null
}

const STATUS_OPTIONS = [
  { value: 'draft',  label: '草稿' },
  { value: 'active', label: '進行中' },
  { value: 'ended',  label: '已結束' },
]

export default function CohortSettingsPanel({ cohort }: { cohort: Cohort }) {
  const router = useRouter()

  // --- Settings form state ---
  const [title, setTitle] = useState(cohort.title)
  const [status, setStatus] = useState(cohort.status)
  const [startsAt, setStartsAt] = useState(cohort.starts_at ?? '')
  const [endsAt, setEndsAt] = useState(cohort.ends_at ?? '')
  const [maxStudents, setMaxStudents] = useState(cohort.max_students?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<'saved' | 'error' | null>(null)

  // --- Enrollments state ---
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [emailInput, setEmailInput] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollResults, setEnrollResults] = useState<{ email: string; status: string }[]>([])
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null)

  const fetchEnrollments = useCallback(async () => {
    setLoadingEnrollments(true)
    const res = await fetch(`/api/cohorts/${cohort.id}/enrollments`)
    if (res.ok) setEnrollments(await res.json())
    setLoadingEnrollments(false)
  }, [cohort.id])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  const handleSaveSettings = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch(`/api/cohorts/${cohort.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        status,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        max_students: maxStudents ? parseInt(maxStudents) : null,
      }),
    })
    setSaving(false)
    setSaveMsg(res.ok ? 'saved' : 'error')
    if (res.ok) router.refresh()
  }

  const handleEnroll = async () => {
    const emails = emailInput
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(Boolean)
    if (emails.length === 0 || enrolling) return

    setEnrolling(true)
    setEnrollResults([])
    const res = await fetch(`/api/cohorts/${cohort.id}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    })
    if (res.ok) {
      const results = await res.json()
      setEnrollResults(results)
      const anyEnrolled = results.some((r: { status: string }) => r.status === 'enrolled')
      if (anyEnrolled) {
        setEmailInput('')
        fetchEnrollments()
      }
    }
    setEnrolling(false)
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    await fetch(`/api/cohorts/${cohort.id}/enrollments/${removeTarget.id}`, { method: 'DELETE' })
    setRemoveTarget(null)
    fetchEnrollments()
  }

  const resultLabel: Record<string, { text: string; className: string }> = {
    enrolled:         { text: '已加入',   className: 'text-green-600' },
    already_enrolled: { text: '已在班級', className: 'text-yellow-600' },
    not_found:        { text: '找不到帳號', className: 'text-red-500' },
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── 班級設定 ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">班級設定</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">班級名稱 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">狀態</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">開始日期</label>
              <input
                type="date"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">結束日期</label>
              <input
                type="date"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">人數上限</label>
            <input
              type="number"
              min="1"
              value={maxStudents}
              onChange={e => setMaxStudents(e.target.value)}
              placeholder="不設限"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSaveSettings}
            disabled={!title.trim() || saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
          {saveMsg === 'saved' && <span className="text-sm text-green-600">已儲存</span>}
          {saveMsg === 'error' && <span className="text-sm text-red-500">儲存失敗，請重試</span>}
        </div>
      </section>

      {/* ── 學生名單 ── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">學生名單</h2>

        {/* 加入學生 */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            輸入學生 Email（多個請換行或用逗號分隔）
          </label>
          <textarea
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            rows={3}
            placeholder={'student1@example.com\nstudent2@example.com'}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />

          {enrollResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {enrollResults.map((r, i) => {
                const label = resultLabel[r.status] ?? { text: r.status, className: 'text-gray-500' }
                return (
                  <p key={i} className="text-xs">
                    <span className="text-gray-600">{r.email}</span>
                    {' — '}
                    <span className={label.className}>{label.text}</span>
                  </p>
                )
              })}
            </div>
          )}

          <button
            onClick={handleEnroll}
            disabled={!emailInput.trim() || enrolling}
            className="mt-3 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {enrolling ? '加入中...' : '加入班級'}
          </button>
        </div>

        {/* 學生列表 */}
        {loadingEnrollments ? (
          <p className="text-sm text-gray-400 py-4 text-center">載入中...</p>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">尚無學生</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.student?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{e.student?.email ?? ''}</p>
                </div>
                <button
                  onClick={() => setRemoveTarget(e)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 移除確認 Modal */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-900 mb-2">移除學生</h3>
            <p className="text-sm text-gray-500 mb-5">
              確定要將「<span className="font-medium text-gray-800">{removeTarget.student?.name}</span>」從班級移除嗎？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                確定移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
