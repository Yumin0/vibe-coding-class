import { createClient } from '@/lib/supabase/server'

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
    return { supabase: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, error: null }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { cohortId } = await params
  const { data, error: dbError } = await supabase!
    .from('cohorts')
    .select('id, title, status, starts_at, ends_at, max_students, template_id')
    .eq('id', cohortId)
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { cohortId } = await params
  const body = await request.json()

  const allowed = ['title', 'status', 'starts_at', 'ends_at', 'max_students']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error: dbError } = await supabase!
    .from('cohorts')
    .update(updates)
    .eq('id', cohortId)
    .select('id, title, status, starts_at, ends_at, max_students')
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}
