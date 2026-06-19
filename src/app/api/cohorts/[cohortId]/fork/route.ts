import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cohortId } = await params
  const { title } = await request.json()
  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })

  // 1. Load source cohort
  const { data: sourceCohort } = await supabase
    .from('cohorts')
    .select('template_id')
    .eq('id', cohortId)
    .single()
  if (!sourceCohort) return Response.json({ error: 'Source cohort not found' }, { status: 404 })

  // 2. Create new cohort
  const { data: newCohort, error: cohortErr } = await supabase
    .from('cohorts')
    .insert({ title: title.trim(), template_id: sourceCohort.template_id, status: 'draft' })
    .select('id')
    .single()
  if (cohortErr) return Response.json({ error: cohortErr.message }, { status: 500 })

  // 3. Load source sections + todos
  const { data: sourceSections } = await supabase
    .from('sections')
    .select(`
      id, column_type, title, position,
      todo_templates ( id, title, subtitle, description, is_required, unlock_after, position )
    `)
    .eq('cohort_id', cohortId)
    .order('position')

  if (!sourceSections || sourceSections.length === 0) {
    return Response.json(newCohort)
  }

  // 4. Insert sections + build old→new todo id map for unlock_after
  const oldToNewTodoId = new Map<number, number>()

  for (const section of sourceSections) {
    const { data: newSection, error: secErr } = await supabase
      .from('sections')
      .insert({
        cohort_id: newCohort.id,
        column_type: section.column_type,
        title: section.title,
        position: section.position,
      })
      .select('id')
      .single()
    if (secErr) return Response.json({ error: secErr.message }, { status: 500 })

    const todos = (section.todo_templates as {
      id: number; title: string; subtitle: string | null
      description: string | null; is_required: boolean
      unlock_after: number | null; position: number
    }[]) ?? []

    // Insert todos without unlock_after first
    for (const todo of todos) {
      const { data: newTodo, error: todoErr } = await supabase
        .from('todo_templates')
        .insert({
          section_id: newSection.id,
          title: todo.title,
          subtitle: todo.subtitle,
          description: todo.description,
          is_required: todo.is_required,
          position: todo.position,
          unlock_after: null,
        })
        .select('id')
        .single()
      if (todoErr) return Response.json({ error: todoErr.message }, { status: 500 })
      oldToNewTodoId.set(todo.id, newTodo.id)
    }
  }

  // 5. Fix unlock_after references using the id map
  const updates: { id: number; unlock_after: number }[] = []
  for (const section of sourceSections) {
    const todos = (section.todo_templates as { id: number; unlock_after: number | null }[]) ?? []
    for (const todo of todos) {
      if (todo.unlock_after !== null) {
        const newTodoId = oldToNewTodoId.get(todo.id)
        const newUnlockAfter = oldToNewTodoId.get(todo.unlock_after)
        if (newTodoId && newUnlockAfter) {
          updates.push({ id: newTodoId, unlock_after: newUnlockAfter })
        }
      }
    }
  }

  for (const upd of updates) {
    await supabase
      .from('todo_templates')
      .update({ unlock_after: upd.unlock_after })
      .eq('id', upd.id)
  }

  return Response.json(newCohort)
}
