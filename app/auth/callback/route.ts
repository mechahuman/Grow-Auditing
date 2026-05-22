import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Middleware handles session refresh instead
            }
          },
        },
      }
    )

    // Exchange code for session
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    // Check user role to determine redirect destination
    if (user) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isAdmin = teamMember?.role === 'admin'
      return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/leads', request.url))
    }
  }

  // Redirect to /login if failed
  return NextResponse.redirect(new URL('/login', request.url))
}
