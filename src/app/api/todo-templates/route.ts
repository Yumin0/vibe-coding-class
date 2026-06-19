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

export async function POST(request: Request) {
  const { supabase, error } = await requireInstructor()
  if (error) return error

  const { section_id, title } = await request.json()
  if (!section_id || !title?.trim()) {
    return Response.json({ error: 'section_id and title are required' }, { status: 400 })
  }

  // Get max position in this section
  const { data: existing } = await supabase
    .from('todo_templates')
    .select('position')
    .eq('section_id', section_id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data, error: dbError } = await supabase
    .from('todo_templates')
    .insert({ section_id, title: title.trim(), position: nextPosition })
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}
