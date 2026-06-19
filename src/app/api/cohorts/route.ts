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

export async function POST(request: Request) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { title, template_id } = await request.json()
  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })

  const { data, error: dbError } = await supabase!
    .from('cohorts')
    .insert({ title: title.trim(), template_id, status: 'draft' })
    .select('id, title, status, starts_at, ends_at, created_at')
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(data)
}
