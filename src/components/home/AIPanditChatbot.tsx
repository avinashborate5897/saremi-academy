import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  RotateCcw, 
  Music, 
  ChevronRight,
  HelpCircle,
  Headphones,
  CheckCircle2
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  time?: string;
}

const INITIAL_GREETING: Message = {
  role: 'model',
  text: `Namaste! 🙏 I am **Saremi AI Pandit**, your interactive musical guru.

Ask me anything about:
• **Indian Classical Music**: Ragas (Yaman, Bhairav, etc.), Taals (Teentaal, Ektaal), Swaras & Riyaaz techniques.
• **Western Music**: Piano, Guitar, Chords, Scales, and Vocal training.
• **Saremi Academy**: Course packages, 1:1 live classes, and booking your **Free 30-Min Live Trial**!

What musical question can I help you with today?`,
  time: 'Just now'
};

const SUGGESTED_QUESTIONS = [
  'What are the course fees?',
  'Explain Raga Yaman',
  'What is Teentaal?',
  'How to do Kharaj Riyaaz?',
  'How to book a Free Trial?'
];

export const AIPanditChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent || isTyping) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', text: messageContent, time: currentTime };
    const updatedMessages = [...messages, userMsg];

    setInput('');
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai-pandit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, text: m.text })) 
        })
      });

      const data = await response.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (data && data.text) {
        setMessages([...updatedMessages, { role: 'model', text: data.text, time: replyTime }]);
      } else {
        setMessages([
          ...updatedMessages, 
          { 
            role: 'model', 
            text: 'Namaste! 🙏 All 1:1 Live Online Music courses at Saremi Academy start at ₹2,499/month (4 sessions) or ₹4,499/month (8 sessions) with a 100% Free 30-min Trial session with our Master Faculty. How can I guide your musical journey?', 
            time: replyTime 
          }
        ]);
      }
    } catch (err) {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        ...updatedMessages, 
        { 
          role: 'model', 
          text: 'Namaste! 🙏 I am Saremi AI Pandit. All 1:1 Live Online Music courses start at ₹2,499/month (4 sessions) or ₹4,499/month (8 sessions) with a 100% Free 30-min Trial session. Please ask me any question regarding Ragas, Taals, instruments, or fees!', 
          time: replyTime 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_GREETING]);
    setInput('');
  };

  // Helper to render markdown-like text nicely (bold, bullets, linebreaks)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Bullet point line
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().replace(/^[•\-]\s*/, '') : line;

      // Parse bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 text-slate-800">
            <span className="text-purple-600 font-bold text-xs mt-0.5">•</span>
            <span className="flex-1 leading-relaxed">{content}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed my-0.5 text-slate-800">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-[998] select-none">
      {/* Floating Circle Toggle with Clear "Saremi AI Pandit" Label */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 15 }}
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          {/* Main Floating Circle Button */}
          <div className="relative">
            {/* Glowing outer pulse animation ring */}
            <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 opacity-40 animate-ping pointer-events-none" />
            <span className="absolute -inset-1 rounded-full bg-purple-500/20 blur-sm group-hover:opacity-100 transition-opacity" />

            <button
              type="button"
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#6C4BF4] via-[#7B52F8] to-[#FF6B8B] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(108,75,244,0.45)] group-hover:shadow-[0_15px_40px_rgba(108,75,244,0.6)] group-hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/90"
              aria-label="Open Saremi AI Pandit Chat"
              title="Click to chat with Saremi AI Pandit"
            >
              {/* Animated Inner Pandit Icon */}
              <motion.div
                animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="relative flex items-center justify-center"
              >
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </motion.div>

              {/* Online Green Blinking Badge */}
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
              </span>
            </button>
          </div>

          {/* Attached Prominent Label Pill */}
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-purple-100 hover:border-purple-300 transition-all duration-200 group-hover:scale-[1.02]">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-extrabold tracking-wide bg-gradient-to-r from-purple-700 via-[#6C4BF4] to-pink-600 bg-clip-text text-transparent font-serif">
                  Saremi AI Pandit
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                Ask Music & Fees <ChevronRight className="w-3 h-3 text-purple-600" />
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-[92vw] sm:w-[420px] max-w-[430px] rounded-[28px] bg-white shadow-[0_20px_60px_rgba(30,15,60,0.28)] border border-purple-100 overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6C4BF4] via-[#7B52F8] to-[#FF6B8B] p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                    >
                      <Bot className="w-6 h-6 text-white drop-shadow" />
                    </motion.div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-purple-700 rounded-full shadow-xs" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif font-bold text-base text-white tracking-wide">
                      Saremi AI Pandit
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/90 text-slate-900 shadow-xs">
                      Guru
                    </span>
                  </div>
                  <p className="text-[11px] text-white/90 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Classical & Western Music • Fees Guide
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset button */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Reset conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Minimize Pandit"
                  aria-label="Minimize Pandit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips Header */}
            <div className="bg-purple-50/70 border-b border-purple-100/70 px-3 py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Sparkles className="w-2.5 h-2.5" /> Ask:
              </span>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={isTyping}
                  className="text-[11px] font-semibold text-purple-900 bg-white hover:bg-purple-100/80 active:scale-95 border border-purple-200/80 rounded-full px-2.5 py-1 whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/80 flex flex-col gap-3.5 min-h-[300px] max-h-[420px] text-xs">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs transition-all ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-tr from-[#6C4BF4] to-[#805BF8] text-white rounded-tr-xs shadow-purple-500/10'
                        : 'bg-white border border-purple-100/90 text-slate-800 rounded-tl-xs shadow-[0_3px_12px_rgba(0,0,0,0.04)]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                    ) : (
                      <div className="text-[12px] space-y-1">
                        {renderFormattedText(msg.text)}
                      </div>
                    )}
                  </div>

                  {msg.time && (
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                      {msg.time}
                    </span>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 self-start bg-white border border-purple-100 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  <span className="text-xs font-semibold text-purple-900">
                    Pandit is meditating on your query...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Actions */}
            <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-1.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about ragas, taals, fees, or courses..."
                  disabled={isTyping}
                  className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6C4BF4] to-[#FF6B8B] hover:opacity-95 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
                  aria-label="Send message to Saremi AI Pandit"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>

              <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Live Guru for Music & Fee Plans
                </span>
                <span className="font-mono text-slate-400">Saremi Academy</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
