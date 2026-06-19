import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { cohortId, title, column_type } = await request.json()

  const { data: existing } = await supabase
    .from('sections')
    .select('position')
    .eq('cohort_id', cohortId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing?.[0]?.position != null ? existing[0].position + 1 : 0

  const { data, error } = await supabase
    .from('sections')
    .insert({ cohort_id: cohortId, title, column_type, position: nextPosition })
    .select('id, column_type, title, position')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ...data, todo_templates: [] })
}
