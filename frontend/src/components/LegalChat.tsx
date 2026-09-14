import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Quote, 
  CornerDownRight, 
  User, 
  Bot
} from 'lucide-react';
import { ChatMessage, AnalyzedClause } from '../types/legal';
import { GeminiService } from '../services/geminiService';

interface LegalChatProps {
  contractText: string;
  clauses: AnalyzedClause[];
  onNavigateToClause?: (clauseId: string) => void;
}

export const LegalChat: React.FC<LegalChatProps> = ({
  contractText,
  clauses,
  onNavigateToClause,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I'm your **LexiGuard AI Legal Co-Pilot**. I have analyzed all provisions in this agreement.\n\nYou can ask me any question about your obligations, termination trapdoors, intellectual property rights, liability caps, or payment terms. I will cite the specific sections where each answer originates.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Can they terminate the agreement early without notice or paying?',
    'Who owns newly created software, tools, and intellectual property?',
    'What is my maximum liability exposure if a third-party sues?',
    'Are there post-termination non-compete or non-solicitation restrictions?',
    'What are my exact payment deadlines and notice requirements?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await GeminiService.answerQuestion(textToSend, contractText, clauses);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an issue processing your query. Please try rephrasing your question.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      className="glass-panel animate-fade-in" 
      style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: '1.5rem' }}
      aria-labelledby="chat-heading"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 id="chat-heading" style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} color="var(--brand-primary)" />
            Grounded Contract Q&A Co-Pilot
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Context-grounded responses with exact clause quote attribution
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            <Sparkles size={11} /> Multi-Model Architecture
          </span>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            style={{ fontSize: '0.76rem', whiteSpace: 'nowrap', padding: '0.35rem 0.65rem' }}
          >
            <CornerDownRight size={12} color="var(--brand-primary)" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          paddingRight: '0.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          marginBottom: '1rem' 
        }}
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '90%',
              }}
            >
              {!isUser && (
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--brand-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    border: '1px solid var(--border-accent)'
                  }}
                  aria-hidden="true"
                >
                  <Bot size={18} color="var(--brand-primary)" />
                </div>
              )}

              <div
                style={{
                  background: isUser ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.885rem', lineHeight: 1.55 }}>
                  {msg.text}
                </div>

                {/* Grounded Citation Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <Quote size={12} /> Grounded Document Citations:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {msg.citations.map((cite, cIdx) => (
                        <div
                          key={cIdx}
                          onClick={() => onNavigateToClause && onNavigateToClause(cite.clauseId)}
                          style={{
                            background: 'var(--bg-surface)',
                            padding: '0.45rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.775rem',
                            cursor: onNavigateToClause ? 'pointer' : 'default',
                            transition: 'border-color var(--transition-fast)',
                          }}
                          role="button"
                          tabIndex={0}
                          title="Click to view clause in Demystifier"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              onNavigateToClause && onNavigateToClause(cite.clauseId);
                            }
                          }}
                        >
                          <strong style={{ color: 'var(--brand-primary)', marginRight: '0.35rem' }}>
                            [{cite.clauseTitle}]
                          </strong>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            "{cite.snippet}"
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', fontSize: '0.7rem', opacity: 0.7 }}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    border: '1px solid var(--border-subtle)'
                  }}
                  aria-hidden="true"
                >
                  <User size={18} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} color="var(--brand-primary)" />
            </div>
            <div className="glass-panel" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div className="animate-pulse">Retrieving clause context & formulating grounded answer...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        style={{ display: 'flex', gap: '0.65rem' }}
      >
        <input
          type="text"
          className="input-custom"
          placeholder="Ask anything (e.g., 'What happens if I terminate before 12 months?')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          aria-label="Ask a legal question about this contract"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
          id="btn-chat-send"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
};
