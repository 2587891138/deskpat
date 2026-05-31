import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null
let currentAbort: AbortController | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env['ANTHROPIC_API_KEY']
    if (!apiKey) {
      throw new Error('未设置 ANTHROPIC_API_KEY，请在环境变量或 .env 文件中配置')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

/** 重新初始化客户端（用于更换 API Key） */
export function resetClient(apiKey?: string): void {
  if (apiKey) {
    client = new Anthropic({ apiKey })
  } else {
    client = null
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const anthropic = getClient()
  currentAbort = new AbortController()

  const stream = anthropic.messages.stream(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
      system: '你是一个桌面宠物AI助手，以2D动漫角色的身份与用户交流。请用友好、活泼的语气回复，回复简洁，像朋友聊天一样。'
    },
    {
      signal: currentAbort.signal
    }
  )

  let fullText = ''

  stream.on('text', (text) => {
    fullText += text
    onChunk(text)
  })

  await stream.finalMessage()
  return fullText
}

export function stopGeneration(): void {
  if (currentAbort) {
    currentAbort.abort()
    currentAbort = null
  }
}