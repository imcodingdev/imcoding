/** Che key: giữ 4 ký tự đầu và 4 ký tự cuối */
export function redactKey(key: string): string {
  if (key.length < 8) return '••••'
  return key.slice(0, 4) + '••••' + key.slice(-4)
}

export function looksLikeGoogleKey(text: string): boolean {
  return /AIza[0-9A-Za-z_-]{35}/.test(text)
}
