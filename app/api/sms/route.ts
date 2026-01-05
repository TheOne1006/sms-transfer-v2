import { NextResponse } from 'next/server'
import { addMessage } from '../../../lib/store'

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function readPayload(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    return typeof body === 'object' && body ? (body as Record<string, unknown>) : {}
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    const fd = await req.formData()
    const obj: Record<string, unknown> = {}
    fd.forEach((v, k) => {
      obj[k] = typeof v === 'string' ? v : String(v)
    })
    return obj
  }
  return {}
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length ? s : undefined
}

export async function POST(req: Request): Promise<Response> {
  const token = req.headers.get('x-webhook-token') || req.headers.get('X-Webhook-Token')
  if (!token || token !== getEnv('WEBHOOK_TOKEN')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const raw = await readPayload(req)
  const provider = str(raw['provider']) || 'sms'
  const to = str(raw['To'])
  const content = str(raw['text']) || ''
  // 提取 3-6 位数字验证码
  const codeMatch = content.match(/\b\d{3,6}\b/)
  const code = codeMatch ? codeMatch[0] : undefined
  const timestamp = new Date().toISOString()

  if (!content) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const saved = addMessage({
    id: `${provider}-${crypto.randomUUID()}`,
    provider,
    to,
    content,
    code,
    timestamp,
  })
  return NextResponse.json({ ok: true, id: saved.id })
}

