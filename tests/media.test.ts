import { expect, it } from 'vitest'
import { validateImageBytes } from '../src/lib/media'
it('rejects SVG, oversized images and MIME spoofing', () => {
  expect(() => validateImageBytes('image/svg+xml', 10, new Uint8Array())).toThrow()
  expect(() => validateImageBytes('image/png', 6 * 1024 * 1024, new Uint8Array())).toThrow()
  expect(() => validateImageBytes('image/png', 50, new TextEncoder().encode('<html>not an image'))).toThrow()
  expect(() => validateImageBytes('image/png', 8, new Uint8Array([137,80,78,71,13,10,26,10]))).not.toThrow()
})
