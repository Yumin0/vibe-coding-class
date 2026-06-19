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

  const { updates }: { updates: { id: number; position: number; section_id: number }[] } = await request.json()

  const results = await Promise.all(
    updates.map(({ id, position, section_id }) =>
      supabase.from('todo_templates').update({ position, section_id }).eq('id', id)
    )
  )

  const failed = results.find(r => r.error)
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 500 })
  return Response.json({ ok: true })
}
