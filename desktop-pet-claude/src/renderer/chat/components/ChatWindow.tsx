import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { useConversationStore } from '../store/conversation'

export function ChatWindow() {
  const { conversations, currentId, loadConversation, createConversation } =
    useConversationStore()

  const handleNewChat = async (): Promise<void> => {
    const conv = await createConversation('新对话')
    loadConversation(conv.id)
  }

  return (
    <div className="chat-window">
      {/* 顶栏 */}
      <header className="chat-header">
        <h1 className="chat-title">桌面宠物 AI</h1>
        <button className="btn-new-chat" onClick={handleNewChat}>
          + 新对话
        </button>
      </header>

      {/* 会话列表 */}
      {conversations.length > 1 && (
        <div className="conversation-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conv-item ${c.id === currentId ? 'active' : ''}`}
              onClick={() => loadConversation(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* 消息区域 */}
      <MessageList />

      {/* 输入区域 */}
      <InputArea />
    </div>
  )
}