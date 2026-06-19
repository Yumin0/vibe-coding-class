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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { sectionId } = await params
  const { title } = await request.json()

  const { error: dbError } = await supabase!
    .from('sections')
    .update({ title })
    .eq('id', sectionId)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { sectionId } = await params

  const { error: dbError } = await supabase!
    .from('sections')
    .delete()
    .eq('id', sectionId)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ ok: true })
}
