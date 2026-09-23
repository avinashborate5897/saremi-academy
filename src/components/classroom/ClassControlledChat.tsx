import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, Clock, User, Check, Sparkles } from 'lucide-react';
import { ClassMessage, UserProfile } from '../../types';
import { subscribeToClassMessages, sendClassMessage } from '../../lib/academicWorkspaceService';
import { triggerHaptic } from '../../utils/haptics';

interface ClassControlledChatProps {
  sessionId: string;
  enrollmentId?: string;
  currentUser: UserProfile | null;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
}

export const ClassControlledChat: React.FC<ClassControlledChatProps> = ({
  sessionId,
  enrollmentId,
  currentUser,
  teacherId,
  teacherName,
  studentId,
  studentName,
  courseTitle
}) => {
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = subscribeToClassMessages(sessionId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentUserId = currentUser?.id || currentUser?.uid || '';
  const isTeacher = currentUser?.role === 'teacher' || currentUserId === teacherId;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const senderRole: 'teacher' | 'student' | 'admin' = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);
    triggerHaptic('light');

    try {
      await sendClassMessage({
        sessionId,
        enrollmentId,
        studentId,
        teacherId,
        senderId: currentUserId,
        senderRole,
        senderName: currentUser?.name || currentUser?.displayName || (isTeacher ? 'Faculty Guru' : 'Student'),
        text: textToSend
      });
      triggerHaptic('success');
    } catch (err) {
      console.error('Failed to send class message:', err);
      triggerHaptic('warning');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[420px] bg-slate-50/60 rounded-2xl border border-slate-200 overflow-hidden text-left">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-900 block leading-tight">
              Class Academic Dialogue
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              Between <strong>{teacherName}</strong> & <strong>{studentName}</strong>
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Shield className="w-3 h-3 text-emerald-600" />
          Secured & Verified
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare className="w-8 h-8 mb-2 text-gray-300 stroke-[1.5]" />
            <p className="text-xs font-bold text-gray-600">No class communications yet</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-1">
              Ask your Guru any question regarding today's riyaz exercises, notes, or technique practice.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isMsgTeacher = msg.senderRole === 'teacher';
            const isMsgAdmin = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold text-gray-400">
                  <span>{msg.senderName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${
                      isMsgTeacher
                        ? 'bg-purple-100 text-purple-800'
                        : isMsgAdmin
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isMsgTeacher ? 'Guru' : isMsgAdmin ? 'Admin' : 'Student'}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-2xs ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-br-xs'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${isTeacher ? studentName : teacherName}...`}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 transition-colors shadow-2xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
