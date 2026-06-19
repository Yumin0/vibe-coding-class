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

  const { updates }: { updates: { id: number; position: number }[] } = await request.json()

  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from('sections').update({ position }).eq('id', id)
    )
  )

  const failed = results.find(r => r.error)
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 500 })
  return Response.json({ ok: true })
}
