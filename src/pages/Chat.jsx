import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Chat.css'

function Chat({ projects }) {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [gatewayStatus, setGatewayStatus] = useState({ online: false })
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const currentProject = projects.find(p => p.id === projectId)
  const taskId = searchParams.get('taskId')

  // Check gateway status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/chat/status')
        const data = await res.json()
        setGatewayStatus(data)
      } catch (e) {
        setGatewayStatus({ online: false, error: e.message })
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load sessions when project changes
  useEffect(() => {
    if (projectId) {
      fetchSessions()
    }
  }, [projectId])

  // Auto-create session if opening from task
  useEffect(() => {
    if (taskId && sessions.length > 0 && !activeSession) {
      const task = currentProject?.tasks?.find(t => t.id === taskId)
      if (task) {
        createSession(`Task: ${task.title.slice(0, 40)}`, taskId)
      }
    }
  }, [taskId, sessions, currentProject])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat/sessions`)
      const data = await res.json()
      setSessions(data.sessions || [])
      
      // Auto-select first session if exists and no task context
      if (data.sessions?.length > 0 && !taskId) {
        loadSession(data.sessions[0].id)
      }
    } catch (e) {
      console.error('Error fetching sessions:', e)
    }
  }

  const loadSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat/sessions/${sessionId}`)
      const data = await res.json()
      setActiveSession(data)
      setMessages(data.messages || [])
    } catch (e) {
      console.error('Error loading session:', e)
    }
  }

  const createSession = async (title = 'Neue Session', forTaskId = null) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, taskId: forTaskId })
      })
      const session = await res.json()
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setMessages([])
      inputRef.current?.focus()
    } catch (e) {
      console.error('Error creating session:', e)
    }
  }

  const deleteSession = async (sessionId) => {
    if (!confirm('Session wirklich löschen?')) return
    
    try {
      await fetch(`/api/projects/${projectId}/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
    } catch (e) {
      console.error('Error deleting session:', e)
    }
  }

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !activeSession || loading) return
    
    const content = input.trim()
    setInput('')
    setLoading(true)
    setStreaming(true)
    setStreamContent('')
    
    // Optimistically add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    
    try {
      const res = await fetch(
        `/api/projects/${projectId}/chat/sessions/${activeSession.id}/messages?stream=true`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({ content, taskId })
        }
      )
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Add complete assistant message
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString()
              }])
              setStreamContent('')
            } else {
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  fullContent += delta
                  setStreamContent(fullContent)
                }
              } catch (e) {}
            }
          }
        }
      }
      
    } catch (e) {
      console.error('Error sending message:', e)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Fehler: ${e.message}`,
        timestamp: new Date().toISOString(),
        error: true
      }])
    } finally {
      setLoading(false)
      setStreaming(false)
      // Refresh sessions to update title
      fetchSessions()
    }
  }

  if (!projectId) {
    return (
      <div className="chat-page">
        <div className="chat-empty">
          <h2>💬 Projekt-Chat</h2>
          <p>Wähle ein Projekt aus der Sidebar um zu chatten.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* Session Sidebar */}
      <div className="chat-sessions">
        <div className="chat-sessions-header">
          <h3>Sessions</h3>
          <button 
            className="new-session-btn"
            onClick={() => createSession()}
            disabled={!gatewayStatus.online}
          >
            + Neu
          </button>
        </div>
        
        <div className="sessions-list">
          {sessions.map(session => (
            <div 
              key={session.id}
              className={`session-item ${activeSession?.id === session.id ? 'active' : ''}`}
              onClick={() => loadSession(session.id)}
            >
              <div className="session-title">{session.title}</div>
              <div className="session-meta">
                {session.messageCount} msgs
                <button 
                  className="session-delete"
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="no-sessions">
              Keine Sessions. Starte eine neue!
            </div>
          )}
        </div>
        
        <div className={`gateway-status ${gatewayStatus.online ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {gatewayStatus.online ? 'Agent Online' : 'Agent Offline'}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <h2>
            {currentProject?.name || 'Chat'}
            {activeSession && <span className="session-name"> / {activeSession.title}</span>}
          </h2>
        </div>
        
        <div className="messages-container">
          {!activeSession ? (
            <div className="chat-welcome">
              <h3>👋 Willkommen im Projekt-Chat</h3>
              <p>Starte eine neue Session um mit dem Agent zu arbeiten.</p>
              <button 
                className="start-chat-btn"
                onClick={() => createSession()}
                disabled={!gatewayStatus.online}
              >
                💬 Neue Session starten
              </button>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {streaming && streamContent && (
                <div className="message assistant streaming">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamContent}
                    </ReactMarkdown>
                    <span className="cursor">▋</span>
                  </div>
                </div>
              )}
              
              {loading && !streamContent && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {activeSession && (
          <form className="chat-input-form" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={gatewayStatus.online ? "Nachricht eingeben..." : "Agent offline"}
              disabled={loading || !gatewayStatus.online}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim() || !gatewayStatus.online}
            >
              {loading ? '...' : '↑'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Chat
