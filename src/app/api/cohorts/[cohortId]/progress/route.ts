import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RawSection = {
  id: number
  title: string
  column_type: string
  position: number
  todo_templates: { id: number; title: string; position: number }[]
}

type RawEnrollment = {
  id: number
  users: { id: string; name: string; avatar_url: string | null } | null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { cohortId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: sectionsRaw } = await supabase
    .from('sections')
    .select(`id, title, column_type, position, todo_templates ( id, title, position )`)
    .eq('cohort_id', cohortId)
    .order('position')

  const sections = (sectionsRaw ?? []) as unknown as RawSection[]

  type FlatTodo = {
    id: number
    title: string
    sectionId: number
    sectionTitle: string
    sectionPosition: number
    columnType: string
    todoPosition: number
  }

  const allTodos: FlatTodo[] = []
  for (const section of sections) {
    const todos = (section.todo_templates ?? []).slice().sort((a, b) => a.position - b.position)
    for (const todo of todos) {
      allTodos.push({
        id: todo.id,
        title: todo.title,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionPosition: section.position,
        columnType: section.column_type,
        todoPosition: todo.position,
      })
    }
  }

  const { data: enrollmentsRaw } = await supabase
    .from('enrollments')
    .select(`id, users ( id, name, avatar_url )`)
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  const enrollments = (enrollmentsRaw ?? []) as unknown as RawEnrollment[]
  if (enrollments.length === 0) return NextResponse.json([])

  const enrollmentIds = enrollments.map(e => e.id)

  const { data: progressRecords } = await supabase
    .from('todo_progress')
    .select('enrollment_id, todo_template_id, status')
    .in('enrollment_id', enrollmentIds)

  const result = enrollments.map(enrollment => {
    const student = enrollment.users
    const doneSet = new Set(
      (progressRecords ?? [])
        .filter(p => p.enrollment_id === enrollment.id && p.status === 'done')
        .map(p => p.todo_template_id)
    )

    const todos = allTodos.map(todo => ({
      todoId: todo.id,
      title: todo.title,
      sectionId: todo.sectionId,
      sectionTitle: todo.sectionTitle,
      sectionPosition: todo.sectionPosition,
      columnType: todo.columnType,
      todoPosition: todo.todoPosition,
      status: doneSet.has(todo.id) ? 'done' : 'pending',
    }))

    return {
      enrollmentId: enrollment.id,
      student: {
        id: student?.id ?? '',
        name: student?.name ?? '未知學生',
        avatarUrl: student?.avatar_url ?? null,
      },
      totalTodos: allTodos.length,
      completedTodos: doneSet.size,
      todos,
    }
  })

  return NextResponse.json(result)
}
