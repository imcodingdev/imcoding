'use client'

import { useSearchParams } from 'next/navigation'

export function LoginErrorBanner() {
  const params = useSearchParams()
  if (params.get('login_error') !== '1') return null
  return (
    <p role="alert" className="border-b border-line bg-red-50 px-4 py-3 text-center text-base text-red-800 dark:bg-red-950 dark:text-red-200">
      Đăng nhập chưa thành công. Bạn thử lại nhé.
    </p>
  )
}
