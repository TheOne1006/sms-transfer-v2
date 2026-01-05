import { clearSession } from '../../../lib/auth'

export async function POST(): Promise<Response> {
  return clearSession()
}

