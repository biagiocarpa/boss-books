import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data } = await supabase.auth.getUser()

  const isLogin = request.nextUrl.pathname === '/admin/login'
  if (!data.user && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
