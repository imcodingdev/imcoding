// Chỉ dùng khi kiểm E2E ngoại tuyến; không tải Google Fonts trong build thử.
module.exports = new Proxy({}, { get: () => '/* Font ngoại tuyến: dùng fallback hệ thống. */' })
