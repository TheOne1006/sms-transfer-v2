import { NextResponse } from 'next/server'
import { issueSession } from '../../../lib/auth'

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}))
  const username = String(body?.username ?? '')
  const password = String(body?.password ?? '')

  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || ''
  if (!adminPassword) {
    return NextResponse.json({ error: 'server not configured' }, { status: 500 })
  }
  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })
  }
  return issueSession()
}

