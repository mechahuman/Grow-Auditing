import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) {
      throw error
    }

    // Map to safe array of objects to avoid exposing PII un-necessarily via the API
    const safeUsers = data.users.map(u => ({
      id: u.id,
      last_sign_in_at: u.last_sign_in_at || null,
      created_at: u.created_at
    }))

    return NextResponse.json(safeUsers)
  } catch (err: any) {
    console.error('Error fetching admin users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
