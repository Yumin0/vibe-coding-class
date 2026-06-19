import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .from('enrollments')
    .select(`
      id, status, enrolled_at,
      users ( id, name )
    `)
    .eq('cohort_id', cohortId)
    .order('enrolled_at')

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  const adminClient = createAdminClient()
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  const result = (data ?? []).map(e => {
    const user = e.users as { id: string; name: string } | null
    return {
      id: e.id,
      status: e.status,
      enrolled_at: e.enrolled_at,
      student: user ? { id: user.id, name: user.name, email: emailMap.get(user.id) ?? '' } : null,
    }
  })

  return Response.json(result)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { supabase, error } = await authorize()
  if (error) return error

  const { cohortId } = await params
  const { emails } = await request.json() as { emails: string[] }
  if (!Array.isArray(emails) || emails.length === 0) {
    return Response.json({ error: 'emails array is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailToId = new Map(authUsers.map(u => [u.email?.toLowerCase(), u.id]))

  const results: { email: string; status: 'enrolled' | 'already_enrolled' | 'not_found' }[] = []

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase()
    if (!email) continue
    const userId = emailToId.get(email)
    if (!userId) {
      results.push({ email, status: 'not_found' })
      continue
    }

    const { error: insertErr } = await supabase!
      .from('enrollments')
      .insert({ student_id: userId, cohort_id: parseInt(cohortId), status: 'active' })

    if (insertErr?.code === '23505') {
      results.push({ email, status: 'already_enrolled' })
    } else if (insertErr) {
      results.push({ email, status: 'not_found' })
    } else {
      results.push({ email, status: 'enrolled' })
    }
  }

  return Response.json(results)
}
