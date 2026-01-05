import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function sign(payload: string): string {
  const secret = getEnv('SESSION_SECRET')
  const nodeCrypto = require('crypto')
  const mac = nodeCrypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${mac}`
}

function verify(token: string | undefined): boolean {
  if (!token) return false
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return false
  const payload = token.slice(0, idx)
  const expected = sign(payload)
  return expected === token
}

export function issueSession(): NextResponse {
  const token = sign('admin')
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return res
}

export function clearSession(): NextResponse {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  return res
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return verify(token)
}

export async function assertAuthenticated(): Promise<NextResponse | null> {
  const ok = await isAuthenticated()
  if (!ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return null
}
