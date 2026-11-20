export const notYetContent = [
  'Chọn theo nhu cầu đã đo, không theo quy mô tưởng tượng.',
  '',
  '- **Tách microservices** — chưa cần khi một app vẫn đủ; cần khi một phần phải mở rộng độc lập.',
  '- **Thêm cache riêng** — chưa cần khi truy vấn đã đủ nhanh; cần khi đo lại vẫn chậm sau tối ưu.',
].join('\n')

export function addNotYet(raw: string, content = notYetContent): string {
  return raw.replace('## Tìm trong project của bạn', `## Khi nào chưa cần\n\n${content}\n\n## Tìm trong project của bạn`)
}
