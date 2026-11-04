import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { safeNext } from '@/lib/safeNext'

// Mã ngắn (không chứa bí mật) để biết đăng nhập hỏng ở bước nào.
const clean = (v: string | null | undefined) => (v ?? '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const failure = (reason: string, detail?: string | null) =>
    NextResponse.redirect(`${origin}/?login_error=1&reason=${reason}${clean(detail) ? `&detail=${clean(detail)}` : ''}`)

  const providerError = searchParams.get('error_code') ?? searchParams.get('error')
  if (providerError) return failure('provider', providerError)
  if (!code) return failure('no_code')
  if (process.env.NEXT_PUBLIC_FAKE_BACKEND === '1') return failure('fake')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.error('auth/callback: thiếu cấu hình Supabase')
    return failure('config')
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('auth/callback: đổi mã đăng nhập thất bại:', error.message)
      return failure('exchange', error.code)
    }
  } catch (e) {
    console.error('auth/callback: lỗi bất ngờ:', e instanceof Error ? e.message : 'không rõ')
    return failure('exception')
  }
  return NextResponse.redirect(`${origin}${safeNext(searchParams.get('next'))}`)
}
