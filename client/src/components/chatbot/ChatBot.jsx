import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Sparkles, RotateCcw } from 'lucide-react';
import { chatbotService } from '../../services/api';
import { v4 as uuidv4 } from 'uuid';

const WELCOME = {
  role: 'assistant',
  content: "Hello! I'm **Aria**, your personal concierge at Sable Grand 🌟\n\nI'm here to help with questions about our hotel, rooms, amenities, and services. All prices are in **South African Rand (ZAR)**. How may I assist you today?",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'What are the check-in times?',
  'What amenities do you offer?',
  'Is Wi-Fi complimentary?',
  'What are breakfast hours?',
  'How do I cancel a booking?',
  'Do you have a spa?',
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0">
      <Bot className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="rounded-2xl rounded-bl-sm px-4 py-3 border border-subtle-t" style={{ background: 'var(--bg-elevated)' }}>
      <div className="flex gap-1">
        {[0, 0.18, 0.36].map((d, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
};

export default function ChatBot() {
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [hasNew,    setHasNew]    = useState(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m !== WELCOME)
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      const { data } = await chatbotService.sendMessage(msg, sessionId, history);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: new Date() }]);
      if (!open) setHasNew(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'I\'m temporarily unavailable. Please contact the front desk at +27 11 555 0100.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: new Date(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setSessionId(uuidv4());
    setInput('');
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 animate-slide-up">
          <div
            className="rounded-2xl shadow-card-xl border border-subtle-t flex flex-col overflow-hidden"
            style={{ background: 'var(--bg-elevated)', height: '540px' }}
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 bg-gradient-to-r from-primary-900 to-primary-950">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm font-display">Aria — AI Concierge</h3>
                <p className="text-white/60 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Sable Grand · Always available
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  title="New conversation"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gold divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3"
              style={{ background: 'var(--bg-base)' }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-surface-900'
                      : 'bg-gradient-to-br from-primary-600 to-primary-800'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5" />
                      : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-br-sm'
                        : msg.isError
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-bl-sm'
                          : 'rounded-bl-sm border border-subtle-t'
                    }`}
                    style={msg.role === 'user' || msg.isError ? {} : {
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <p dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    <p className={`text-[10px] mt-1 ${
                      msg.role === 'user' ? 'text-white/50 text-right' : 'text-muted'
                    }`}>
                      {msg.timestamp?.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {loading && <TypingIndicator />}

              {/* Suggestions */}
              {messages.length === 1 && !loading && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-subtle-t hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-400 transition-all"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 border-t border-subtle-t"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything about the hotel..."
                  rows={1}
                  disabled={loading}
                  className="form-input !py-2.5 !rounded-xl text-sm flex-1 resize-none max-h-24 scrollbar-thin"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 text-surface-900 flex items-center justify-center flex-shrink-0 hover:from-gold-400 hover:to-gold-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-center mt-2 text-muted">
                Powered by Google Gemini · Sable Grand AI Concierge
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-2xl text-white shadow-card-lg transition-all duration-300 active:scale-95 flex items-center justify-center"
        style={{
          background: open
            ? 'linear-gradient(135deg, #1a2d66, #0A1628)'
            : 'linear-gradient(135deg, #C9A84C, #b08a2a)',
        }}
        aria-label="Toggle chat"
      >
        {open ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            {hasNew && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
                !
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
