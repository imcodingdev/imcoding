import { afterEach, expect, it, vi } from 'vitest'
import { loadConcepts } from '../../src/lib/concepts/load'

afterEach(() => vi.unstubAllEnvs())

it('chỉ nạp fixture bổ sung khi bật cả fake backend và thư mục e2e', () => {
  vi.stubEnv('IMCODING_E2E_CONTENT_DIR', 'tests/fixtures/concepts-v2')
  vi.stubEnv('NEXT_PUBLIC_FAKE_BACKEND', '0')
  expect(loadConcepts()).toHaveLength(16)
  vi.stubEnv('NEXT_PUBLIC_FAKE_BACKEND', '1')
  expect(loadConcepts()).toHaveLength(17)
  expect(loadConcepts().find(c => c.id === 'v2-lesson')?.format).toBe(2)
  expect(loadConcepts('content/concepts')).toHaveLength(16)
  vi.stubEnv('IMCODING_E2E_CONTENT_DIR', '')
  expect(loadConcepts()).toHaveLength(16)
})
