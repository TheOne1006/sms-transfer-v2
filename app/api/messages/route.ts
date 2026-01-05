import { NextResponse } from 'next/server'
import { assertAuthenticated } from '../../../lib/auth'
import { listMessages } from '../../../lib/store'

function parseJSONParam<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function GET(req: Request): Promise<Response> {
  const unauthorized = await assertAuthenticated()
  if (unauthorized) return unauthorized

  const url = new URL(req.url)
  const filter = parseJSONParam<Record<string, unknown>>(url.searchParams.get('filter'), {})

  const { data, total, range: r } = listMessages({
    filter,
  })

  const res = NextResponse.json(data)
  res.headers.set('X-Total-Count', String(total))
  res.headers.set('Content-Range', `messages ${r[0]}-${r[1]}/${total}`)
  return res
}
