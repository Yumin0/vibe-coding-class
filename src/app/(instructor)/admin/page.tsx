import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCohortList from '@/components/admin/AdminCohortList'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const [{ data: cohortsRaw }, { data: templates }] = await Promise.all([
    supabase
      .from('cohorts')
      .select(`
        id, title, status, starts_at, ends_at, created_at, template_id,
        course_templates ( id, title ),
        enrollments ( id )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('course_templates')
      .select('id, title')
      .order('title'),
  ])

  const cohorts = (cohortsRaw ?? []).map(c => {
    const template = c.course_templates as unknown as { id: number; title: string } | null
    return {
      id: c.id,
      title: c.title,
      status: c.status,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      studentCount: (c.enrollments as { id: number }[] | null)?.length ?? 0,
      templateTitle: template?.title ?? null,
      templateId: template?.id ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">講師後台</h1>
        <span className="text-sm text-gray-500">{profile.name}</span>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <AdminCohortList
          cohorts={cohorts}
          templates={templates ?? []}
        />
      </main>
    </div>
  )
}
