import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { useConversationStore } from '../store/conversation'

export function MessageList() {
  const { messages, streamingContent } = useConversationStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="message-list">
      {messages.length === 0 && !streamingContent && (
        <div className="empty-hint">
          <p>点击桌面上的宠物开始对话</p>
          <p>或按 Ctrl+Shift+C 打开此窗口</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} isStreaming />
      )}
      <div ref={bottomRef} />
    </div>
  )
}