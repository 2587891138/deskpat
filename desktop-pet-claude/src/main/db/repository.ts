import { uuidv4 } from './uuid'
import { getDatabase } from './connection'

export interface Conversation {
  id: string
  title: string
  created_at: number
  updated_at: number
}

export interface Message {
  id: number
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: number
}

export function createConversation(title: string): Conversation {
  const db = getDatabase()
  const id = uuidv4()
  const now = Date.now()
  db.prepare(
    'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).run(id, title, now, now)
  return { id, title, created_at: now, updated_at: now }
}

export function getConversations(): Conversation[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
    .all() as Conversation[]
}

export function getMessages(conversationId: string): Message[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId) as Message[]
}

export function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Message {
  const db = getDatabase()
  const now = Date.now()
  const result = db
    .prepare(
      'INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(conversationId, role, content, now)

  // 更新会话时间
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversationId)

  return {
    id: result.lastInsertRowid as number,
    conversation_id: conversationId,
    role,
    content,
    created_at: now
  }
}