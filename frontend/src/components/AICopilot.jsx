import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, MessageSquare, X, Send, Bot,
  User, ArrowRight, ShieldCheck, Truck, ShoppingCart, HelpCircle
} from 'lucide-react'
import api from '../api'

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your **ReSourceX AI Copilot**.\n\nI can explain order confirmation workflows, help you coordinate logistics carriers, find compatible raw materials, and navigate verified Waste Passports. Ask me anything!",
      suggestions: [
        "Why do I see waiting for confirmation on my order?",
        "How do logistics and vehicle dispatch work?",
        "How does automated material matching work?",
        "Explain Digital Waste Passports",
      ],
    },
  ])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend) => {
    const text = textToSend || inputMessage
    if (!text.trim() || loading) return

    const userMsg = { sender: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setLoading(true)

    try {
      const res = await api.post('/ai/copilot', { message: text })
      const aiReply = {
        sender: 'ai',
        text: res.data.reply,
        suggestions: res.data.suggestions || [],
        action_intent: res.data.action_intent,
        action_data: res.data.action_data,
      }
      setMessages((prev) => [...prev, aiReply])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I couldn't connect to the AI intelligence engine right now. Please check if the backend server is running.",
          suggestions: ["Check active orders", "Open marketplace"],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (intent, data) => {
    if (data?.route) {
      navigate(data.route)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Floating Sparkle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            height: '46px',
            padding: '0 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-600)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            zIndex: 999,
            transition: 'all 0.2s ease',
          }}
          title="Ask ReSourceX AI Copilot"
        >
          <Sparkles size={16} />
          <span>AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            animation: 'slideUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--bg-primary)',
              color: 'var(--gray-950)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--blue-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="var(--primary-500)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--gray-950)' }}>
                  ReSourceX AI Copilot
                </h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--primary-500)', fontWeight: 500 }}>
                  Active • Circular Intelligence Engine
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="btn-ghost btn-icon"
              style={{ color: 'var(--gray-500)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--bg-secondary)',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.sender === 'user' ? 'var(--blue-accent)' : 'var(--bg-primary)',
                    color: m.sender === 'user' ? '#ffffff' : 'var(--gray-900)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}

                  {m.action_intent && m.action_data && (
                    <button
                      onClick={() => handleAction(m.action_intent, m.action_data)}
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--blue-subtle)',
                        color: 'var(--primary-500)',
                        border: '1px solid var(--blue-border)',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <span>Take me there</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {/* Prompt Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {m.suggestions.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(s)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          color: 'var(--primary-500)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        💡 {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                <span className="text-muted text-xs">AI is analyzing circular database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.875rem', padding: '10px 14px' }}
              placeholder="Ask anything about orders, logistics, matching..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={!inputMessage.trim() || loading}
              style={{ flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4), 0 0 15px rgba(59, 130, 246, 0.25);
          }
          50% {
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.65), 0 0 25px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </>
  )
}
