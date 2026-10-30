import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('WindowResizeHandles Tauri capability', () => {
  it('allows the main window to start native resize dragging', () => {
    const capability = JSON.parse(
      readFileSync('backend/capabilities/default.json', 'utf8')
    ) as { permissions: string[] }

    expect(capability.permissions).toContain(
      'core:window:allow-start-resize-dragging'
    )
  })
})
