import { useState, useRef, KeyboardEvent } from 'react'
import { useConversationStore } from '../store/conversation'

export function InputArea() {
  const [input, setInput] = useState('')
  const { isLoading, sendMessage } = useConversationStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = (): void => {
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
    // 通知宠物窗口开始思考
    window.electronAPI.notifyThinking()
  }

  const handleStop = (): void => {
    window.electronAPI.stopGeneration()
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="input-area">
      <textarea
        ref={textareaRef}
        className="input-field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        rows={2}
        disabled={isLoading}
      />
      <div className="input-actions">
        {isLoading ? (
          <button className="btn-stop" onClick={handleStop}>
            停止生成
          </button>
        ) : (
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </button>
        )}
      </div>
    </div>
  )
}