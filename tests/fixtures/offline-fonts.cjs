// Chỉ dùng cho build kiểm thử: không tải CSS hoặc font từ Google.
// Giữ tên font để Next.js sinh biến CSS; trình duyệt dùng font dự phòng.
module.exports = new Proxy({}, {
  get(_target, url) {
    const family = new URL(url).searchParams.get('family').split(':')[0]
    return `@font-face { font-family: '${family}'; font-style: normal; font-weight: 100 900; }`
  },
})
