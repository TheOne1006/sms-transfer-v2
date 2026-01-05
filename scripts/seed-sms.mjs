const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const token = process.env.WEBHOOK_TOKEN || 'webhook_token'

const messages = [
  {
    provider: 'demo',
    To: '10690000',
    text: '您的验证码是 123456，请在 5 分钟内输入。',
  },
  {
    provider: 'demo',
    To: '10690000',
    text: '登录验证码：9876，请勿泄露给他人。',
    timestamp: new Date().toISOString(),
  },
  {
    provider: 'demo',
    To: '10690000',
    text: '测试短信 3',
  },
]

async function main() {
  for (const msg of messages) {
    const res = await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': token,
      },
      body: JSON.stringify(msg),
    })
    const text = await res.text()
    console.log(res.status, text)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

