import { createClient } from '@/lib/supabase/server'

async function requireInstructor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return { supabase, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { supabase, error: null }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ todoId: string }> }
) {
  const { supabase, error } = await requireInstructor()
  if (error) return error

  const { todoId } = await params
  const id = parseInt(todoId)
  if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json()
  const { title, subtitle, description, is_required, unlock_after } = body

  const { data, error: dbError } = await supabase
    .from('todo_templates')
    .update({ title, subtitle: subtitle || null, description: description || null, is_required, unlock_after: unlock_after ?? null })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ todoId: string }> }
) {
  const { supabase, error } = await requireInstructor()
  if (error) return error

  const { todoId } = await params
  const id = parseInt(todoId)
  if (isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const { error: dbError } = await supabase
    .from('todo_templates')
    .delete()
    .eq('id', id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ ok: true })
}
