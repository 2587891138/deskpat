import { useEffect } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { useConversationStore } from './store/conversation'

export default function App() {
  const { setConversations, setCurrentId, currentId, createConversation } =
    useConversationStore()

  useEffect(() => {
    // 加载已有会话或创建新会话
    async function init(): Promise<void> {
      const convs = await window.electronAPI.getConversations()
      if (convs.length > 0) {
        setConversations(convs)
        setCurrentId(convs[0].id)
      } else {
        const conv = await createConversation('新对话')
        setCurrentId(conv.id)
      }
    }
    init()
  }, [])

  return (
    <div className="app">
      <ChatWindow />
    </div>
  )
}