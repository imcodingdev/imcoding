import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#18181B' }}>
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path d="M10 21L16 11L22 18" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="21" r="3" fill="#FAF8F5" />
          <circle cx="16" cy="11" r="3" fill="#FAF8F5" />
          <circle cx="22" cy="18" r="4" fill="#C2410C" />
          <circle cx="22" cy="18" r="1.5" fill="#FAF8F5" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
