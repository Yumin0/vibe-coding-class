'use client'

import { useState } from 'react'
import Link from 'next/link'
import KanbanEditor from './KanbanEditor'
import CohortSettingsPanel from './CohortSettingsPanel'
import StudentProgressPanel from './StudentProgressPanel'

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

type Cohort = {
  id: number
  title: string
  status: string
  starts_at: string | null
  ends_at: string | null
  max_students: number | null
  templateTitle: string | null
}

type Tab = 'curriculum' | 'students' | 'settings'

const tabs: { key: Tab; label: string }[] = [
  { key: 'curriculum', label: '課程設計' },
  { key: 'students',   label: '學生進度' },
  { key: 'settings',   label: '班級設定' },
]

type Props = {
  cohort: Cohort
  sections: Section[]
}

export default function CohortDetailView({ cohort, sections }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('curriculum')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
          <Link href="/admin" className="hover:text-gray-700 transition-colors">班級列表</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{cohort.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{cohort.title}</h1>
            {cohort.templateTitle && (
              <p className="text-xs text-gray-400 mt-0.5">{cohort.templateTitle}</p>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6">
        {activeTab === 'curriculum' && (
          <KanbanEditor cohortId={cohort.id} initialSections={sections} />
        )}
        {activeTab === 'students' && (
          <StudentProgressPanel cohortId={cohort.id} />
        )}
        {activeTab === 'settings' && (
          <CohortSettingsPanel cohort={cohort} />
        )}
      </main>
    </div>
  )
}
