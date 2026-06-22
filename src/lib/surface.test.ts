import { expect, it } from 'vitest'
import { getSurface, readWidgetParams } from './surface'

it('detects the bubble surface from the pathname', () => {
  expect(getSurface('/ai-agent/sdk/bubble')).toBe('bubble')
  expect(getSurface('/ai-agent/sdk/bubble/')).toBe('bubble')
})

it('defaults to the chat surface', () => {
  expect(getSurface('/ai-agent/sdk/')).toBe('chat')
  expect(getSurface('/ai-agent/sdk')).toBe('chat')
})

it('reads tenant_id and isAllowExpandBot from the query string', () => {
  expect(readWidgetParams('?tenant_id=abc-123&isAllowExpandBot=1')).toEqual({
    tenantId: 'abc-123',
    isAllowExpandBot: true,
  })
})

it('returns null tenant and false expand when params are absent', () => {
  expect(readWidgetParams('')).toEqual({ tenantId: null, isAllowExpandBot: false })
})
