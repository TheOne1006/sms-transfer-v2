import { NextResponse } from 'next/server'
import { assertAuthenticated } from '../../../../lib/auth'
import { getMessage } from '../../../../lib/store'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const unauthorized = await assertAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await params
  const msg = getMessage(id)
  if (!msg) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json(msg)
}
