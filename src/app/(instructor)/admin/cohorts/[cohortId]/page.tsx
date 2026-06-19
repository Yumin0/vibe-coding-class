import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CohortDetailView from '@/components/admin/CohortDetailView'

type Section = {
  id: number
  column_type: 'input' | 'progress' | 'output'
  title: string
  position: number
  todo_templates: {
    id: number
    title: string
    subtitle: string | null
    description: string | null
    is_required: boolean
    unlock_after: number | null
    position: number
  }[]
}

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ cohortId: string }>
}) {
  const { cohortId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { data: cohort } = await supabase
    .from('cohorts')
    .select(`
      id, title, status, starts_at, ends_at, max_students,
      course_templates ( title )
    `)
    .eq('id', cohortId)
    .single()

  if (!cohort) notFound()

  const { data: sectionsRaw } = await supabase
    .from('sections')
    .select(`
      id, column_type, title, position,
      todo_templates (
        id, title, subtitle, description, is_required, unlock_after, position
      )
    `)
    .eq('cohort_id', cohortId)
    .order('position')

  const template = cohort.course_templates as unknown as { title: string } | null
  const sections = (sectionsRaw ?? []) as unknown as Section[]

  return (
    <CohortDetailView
      cohort={{
        id: cohort.id,
        title: cohort.title,
        status: cohort.status,
        starts_at: cohort.starts_at,
        ends_at: cohort.ends_at,
        max_students: cohort.max_students ?? null,
        templateTitle: template?.title ?? null,
      }}
      sections={sections}
    />
  )
}
