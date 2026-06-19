import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/board/KanbanBoard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'instructor'

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      cohort:cohorts (
        id,
        title,
        sections (
          id,
          column_type,
          title,
          position,
          todo_templates (
            id,
            title,
            subtitle,
            is_required,
            unlock_after,
            position
          )
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')
    .single()

  const { data: progressData } = enrollment
    ? await supabase
        .from('todo_progress')
        .select('todo_template_id, status')
        .eq('enrollment_id', enrollment.id)
    : { data: [] }

  const progressMap = Object.fromEntries(
    (progressData ?? []).map(p => [p.todo_template_id, p.status as 'pending' | 'done'])
  )

  const cohort = enrollment?.cohort as unknown as {
    id: number
    title: string
    sections: {
      id: number
      column_type: 'input' | 'progress' | 'output'
      title: string
      position: number
      todo_templates: {
        id: number
        title: string
        subtitle: string | null
        is_required: boolean
        unlock_after: number | null
        position: number
      }[]
    }[]
  } | null

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-[#ECE8E3] px-8 md:px-16 lg:px-24 xl:px-36 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Vibe Coding Class</h1>
          {cohort && <p className="text-xs text-gray-400 mt-0.5">{cohort.title}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              進後台
            </Link>
          )}
          <span className="text-sm text-gray-500">{profile?.name}</span>
        </div>
      </header>

      <main className="px-8 md:px-16 lg:px-24 xl:px-36 py-10 md:py-14">
        {!enrollment || !cohort ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">你尚未加入任何班級</p>
            <p className="text-sm mt-1">請聯繫講師將你加入班級</p>
          </div>
        ) : (
          <KanbanBoard
            enrollmentId={enrollment.id}
            sections={cohort.sections}
            initialProgress={progressMap}
          />
        )}
      </main>
    </div>
  )
}
