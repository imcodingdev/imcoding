// Chạy sau `next build --webpack` khi junction khiến Turbopack không resolve được Next.
// Chỉ biên dịch artifact .next trong lane; không sửa nguồn hoặc dependency dùng chung.
const fs = require('node:fs/promises')
const path = require('node:path')
const { compile } = require('@tailwindcss/node')
const { Scanner } = require('@tailwindcss/oxide')

async function main() {
  const root = path.resolve(__dirname, '../..')
  const cssDirectory = path.join(root, '.next/static/css')
  const scanner = new Scanner({ sources: [{ base: path.join(root, 'src'), pattern: '**/*.{ts,tsx,css}', negated: false }] })
  const candidates = scanner.scan()
  for (const name of await fs.readdir(cssDirectory)) {
    if (!name.endsWith('.css')) continue
    const file = path.join(cssDirectory, name)
    const css = await fs.readFile(file, 'utf8')
    if (!css.includes('@tailwind utilities')) continue
    const compiler = await compile(css, { base: root, onDependency() {} })
    await fs.writeFile(file, compiler.build(candidates))
    console.log(`Đã biên dịch Tailwind: ${path.relative(root, file)}`)
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
