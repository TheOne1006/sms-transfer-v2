import { Message } from './types'

type StoreData = {
  messages: Message[]
}

const MAX_MESSAGES = 100

function getStore(): StoreData {
  const g = globalThis as unknown as { __SMS_STORE?: any }
  // 如果不存在，或者结构不匹配（例如旧版本是 Map，新版本是 Array），则重置
  if (!g.__SMS_STORE || !Array.isArray(g.__SMS_STORE.messages)) {
    g.__SMS_STORE = {
      messages: [],
    }
  }
  return g.__SMS_STORE as StoreData
}

export function addMessage(input: Omit<Message, 'createdAt'> & Partial<Pick<Message, 'createdAt'>>): Message {
  const msg: Message = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  const store = getStore()
  
  // 检查是否已存在（避免重复添加，虽然用 UUID 很难重复）
  const exists = store.messages.some(m => m.id === msg.id)
  if (!exists) {
    store.messages.unshift(msg)
    
    // 限制最大数量
    if (store.messages.length > MAX_MESSAGES) {
      store.messages = store.messages.slice(0, MAX_MESSAGES)
    }
  }
  
  return msg
}

export function getMessage(id: string): Message | undefined {
  const store = getStore()
  return store.messages.find(m => m.id === id)
}

export function listMessages(params?: {
  start?: number
  end?: number
  sort?: string
  order?: 'ASC' | 'DESC'
  filter?: Record<string, unknown>
}): { data: Message[]; total: number; range: [number, number] } {
  const store = getStore()
  let result = store.messages.slice()

  const filter = params?.filter ?? {}
  const q = typeof filter['q'] === 'string' ? (filter['q'] as string).toLowerCase() : undefined
  if (q) {
    result = result.filter((m) => {
      const fields = [m.content, m.to, m.provider, m.code].filter(Boolean).map((x) => String(x).toLowerCase())
      return fields.some((f) => f.includes(q))
    })
  }

  const sortField = params?.sort
  const sortOrder = params?.order

  // 只有当明确指定了排序，且不是默认的按照创建时间倒序（因为默认存储顺序就是倒序）时，才进行排序
  if (sortField && (sortField !== 'createdAt' || sortOrder !== 'DESC')) {
    result.sort((a, b) => {
      const va = (a as any)[sortField]
      const vb = (b as any)[sortField]
      let cmp = 0
      if (va === vb) cmp = 0
      else if (va === undefined) cmp = -1
      else if (vb === undefined) cmp = 1
      else cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
  }

  const total = result.length
  const start = Math.max(0, params?.start ?? 0)
  const end = Math.min(total - 1, params?.end ?? Math.max(0, total - 1))
  
  // 如果没有任何数据，end 可能小于 start，导致 slice 返回空，这是正确的
  // 但如果 params.end 没传，默认是 total-1。如果 total 是 0，end 是 -1。
  // slice(0, 0) 是空的。
  
  const data = result.slice(start, end + 1)
  return { data, total, range: [start, end] }
}
