export type Surface = 'bubble' | 'chat'

export function getSurface(pathname: string = window.location.pathname): Surface {
  return pathname.replace(/\/+$/, '').endsWith('/bubble') ? 'bubble' : 'chat'
}

export interface WidgetParams {
  tenantId: string | null
  isAllowExpandBot: boolean
}

export function readWidgetParams(search: string = window.location.search): WidgetParams {
  const params = new URLSearchParams(search)
  return {
    tenantId: params.get('tenant_id'),
    isAllowExpandBot: params.get('isAllowExpandBot') != null,
  }
}
