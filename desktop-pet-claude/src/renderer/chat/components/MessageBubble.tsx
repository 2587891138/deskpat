interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar">{isUser ? '我' : 'AI'}</div>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-ai'} ${isStreaming ? 'streaming' : ''}`}>
        {content || (isStreaming ? '...' : '')}
        {isStreaming && <span className="cursor-blink">|</span>}
      </div>
    </div>
  )
}