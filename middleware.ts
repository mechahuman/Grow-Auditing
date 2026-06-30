import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Skip middleware for API routes and static assets
  if (pathname.startsWith('/api/')) return response
  if (pathname.startsWith('/auth/')) return response
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) return response

  // Fallback: If Supabase Redirect URLs are misconfigured and it falls back to the Site URL
  // with an OAuth code, catch it and forward it to the callback handler.
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    return NextResponse.redirect(new URL(`/auth/callback?${request.nextUrl.searchParams.toString()}`, request.url))
  }

  const isLoginPage = pathname === '/login'
  const isUnauthorizedPage = pathname === '/unauthorized'

  // If not authenticated, redirect to login
  if (!user && !isLoginPage && !isUnauthorizedPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If not authenticated, allow access to public auth pages
  if (!user) {
    return response
  }

  // User is authenticated — fetch role and active status
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role, active')
    .eq('user_id', user.id)
    .single()

  // If user not in whitelist or not active, redirect to unauthorized
  if (error || !teamMember || !teamMember.active) {
    if (isUnauthorizedPage) return response
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  const isAdminUser = teamMember.role === 'admin'

  // If authenticated and on login page, redirect based on role
  if (isLoginPage) {
    const redirectUrl = isAdminUser ? '/admin' : '/leads'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Strict role isolation
  const isAdminRoute = pathname.startsWith('/admin')

  // If admin tries to access non-admin route, redirect to /admin
  if (isAdminUser && !isAdminRoute) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // If member tries to access /admin, redirect to /leads
  if (!isAdminUser && isAdminRoute) {
    return NextResponse.redirect(new URL('/leads', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|video).*)'],
}
