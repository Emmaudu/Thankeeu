import { useState, useEffect, useRef } from 'react';
import { Send, Image, Paperclip, Phone, Smile, X, Trash2, ShieldCheck, Mic } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatApi } from '../../utils/api';
import toast from 'react-hot-toast';

// Reaction emojis — allowed in chat/reactions
const REACTION_EMOJIS = ['👍','❤️','😂','😮','😢','🙏','🔥','✅'];

// Emoji picker for sending in messages
const SEND_EMOJIS = [
  '😀','😂','😍','🤔','😅','😭','🥰','😎','🤣','😊',
  '👍','👎','❤️','🔥','✅','🙏','💯','🎉','😮','😢',
];

export default function ChatWindow({ room, onClose }) {
  const { user } = useAuth();
  const { socket, isOnline, joinRoom, leaveRoom, sendTyping } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [emojiMenu, setEmojiMenu] = useState(null);   // reaction menu: message id
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // send emoji picker
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  // Voice note recording
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordStreamRef = useRef(null);
  // Off-platform warning is shown at most ONCE per chat session, and never
  // blocks sending — it's a gentle one-time heads-up, not a nag.
  const offPlatformWarnedRef = useRef(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(true);

  const partner = user?.id === room.requester_id ? room.tasker : room.requester;

  useEffect(() => {
    loadMessages();
    joinRoom(room.id);
    return () => {
      leaveRoom(room.id);
      clearTimeout(typingTimer.current);
      // Release mic + timer if the window closes while recording
      clearInterval(recordTimerRef.current);
      recordStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null;
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
    };
  }, [room.id]);

  useEffect(() => {
    if (!socket) return;
    const onNewMsg = (msg) => {
      if (msg.room_id === room.id) { setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])); scrollToBottom(); }
    };
    const onTyping = ({ user_id, is_typing }) => {
      if (user_id !== user.id) setPartnerTyping(is_typing);
    };
    const onMsgDeleted = ({ message_id }) => {
      setMessages((prev) => prev.map((m) => m.id === message_id ? { ...m, is_deleted: true, content: 'Message deleted' } : m));
    };
    const onReaction = ({ message_id, reactions }) => {
      setMessages((prev) => prev.map((m) => m.id === message_id ? { ...m, reactions } : m));
    };
    socket.on('new_message', onNewMsg);
    socket.on('user_typing', onTyping);
    socket.on('message_deleted', onMsgDeleted);
    socket.on('reaction_update', onReaction);
    return () => {
      socket.off('new_message', onNewMsg);
      socket.off('user_typing', onTyping);
      socket.off('message_deleted', onMsgDeleted);
      socket.off('reaction_update', onReaction);
    };
  }, [socket, room.id, user.id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await chatApi.getMessages(room.id);
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
      setTimeout(scrollToBottom, 100);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!typing) { setTyping(true); sendTyping(room.id, true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { setTyping(false); sendTyping(room.id, false); }, 1500);
  };

  const insertEmoji = (emoji) => {
    const pos = inputRef.current?.selectionStart ?? text.length;
    const newText = text.slice(0, pos) + emoji + text.slice(pos);
    setText(newText);
    setShowEmojiPicker(false);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(pos + emoji.length, pos + emoji.length); }, 0);
  };

  // Show the off-platform heads-up at most once per session. Never blocks.
  const maybeWarnOffPlatform = (warning) => {
    if (!warning || offPlatformWarnedRef.current) return;
    offPlatformWarnedRef.current = true;
    toast(warning, { icon: '🛡️', duration: 8000, style: { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontSize: '13px' } });
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !fileRef.current?.files[0]) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (trimmed) formData.append('content', trimmed);
      if (fileRef.current?.files[0]) formData.append('media', fileRef.current.files[0]);
      const { data } = await chatApi.sendMessage(room.id, formData);
      setText('');
      if (fileRef.current) fileRef.current.value = '';
      sendTyping(room.id, false);
      setTyping(false);
      maybeWarnOffPlatform(data?.offPlatformWarning);
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  // ── Voice note recording (WhatsApp-style) ──────────────────────
  const startRecording = async () => {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Voice recording is not supported on this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      // Pick a mime type the browser actually supports
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported?.(t)) || '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          // Hard cap at 3 minutes to stay well under the 25MB upload limit
          if (s >= 180) { stopAndSendRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error('Microphone access denied. Enable mic permission to send voice notes.');
    }
  };

  const cleanupRecording = () => {
    clearInterval(recordTimerRef.current);
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    mediaRecorderRef.current = null;
    setRecording(false);
    setRecordSecs(0);
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') { mr.onstop = null; mr.stop(); }
    audioChunksRef.current = [];
    cleanupRecording();
  };

  const stopAndSendRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') { cleanupRecording(); return; }
    mr.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
      audioChunksRef.current = [];
      cleanupRecording();
      if (blob.size < 500) { toast.error('Recording too short'); return; } // ignore accidental taps
      setSending(true);
      try {
        const ext = (mr.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : (mr.mimeType || '').includes('ogg') ? 'ogg' : 'webm';
        const formData = new FormData();
        formData.append('media', blob, `voice-note.${ext}`);
        const { data } = await chatApi.sendMessage(room.id, formData);
        maybeWarnOffPlatform(data?.offPlatformWarning);
      } catch { toast.error('Failed to send voice note'); }
      finally { setSending(false); }
    };
    mr.stop();
  };

  const fmtRecordTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleReact = async (msgId, emoji) => {
    try { await chatApi.react(room.id, msgId, { emoji }); setEmojiMenu(null); } catch {}
  };

  const handleDelete = async (msgId) => {
    try { await chatApi.deleteMessage(room.id, msgId); }
    catch { toast.error('Failed to delete message'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const partnerOnline = isOnline(partner?.id);

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = (msg.created_at ? format(new Date(msg.created_at), 'MMM d, yyyy') : '—');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-card">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-rose-100 overflow-hidden">
            {partner?.avatar_url ? (
              <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">
                {partner?.full_name?.[0]}
              </div>
            )}
          </div>
          {partnerOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{partner?.full_name}</p>
          <p className={clsx('text-xs', partnerOnline ? 'text-rose-600' : 'text-muted')}>
            {partnerTyping ? 'typing...' : partnerOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {partner?.phone && (
            <a href={`tel:${partner.phone}`}
              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              title="Call">
              <Phone size={16} />
            </a>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* On-platform safety banner — one-time, dismissible */}
      {showSafetyBanner && (
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <ShieldCheck size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug text-amber-800 flex-1">
            Keep chat &amp; payment on Taskeeu so support can help if there's a dispute. You're free to chat however you like.
          </p>
          <button onClick={() => setShowSafetyBanner(false)} className="flex-shrink-0 text-amber-500 hover:text-amber-700" title="Dismiss">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-3">
              <Phone size={24} className="text-rose-500" />
            </div>
            <p className="font-semibold text-gray-700">Start the conversation!</p>
            <p className="text-sm text-muted mt-1">Agree on task details and payment here</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-muted bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">{date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {msgs.map((msg) => {
                if (msg.is_bot) return <KeeuMessage key={msg.id} msg={msg} />;
                const isMine = msg.sender_id === user.id;
                const reactionEntries = Object.entries(msg.reactions || {});

                return (
                  <div key={msg.id} className={clsx('flex gap-2 mb-3 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
                    {/* Avatar */}
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-rose-100 overflow-hidden flex-shrink-0 self-end">
                        {msg.sender?.avatar_url ? (
                          <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-600 text-xs font-bold">
                            {msg.sender?.full_name?.[0]}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={clsx('flex flex-col max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                      {/* Bubble */}
                      <div className={clsx(
                        isMine ? 'chat-bubble-sent' : 'chat-bubble-received',
                        msg.is_deleted && 'opacity-50 italic',
                        'min-w-[60px]'
                      )}>
                        {msg.media_url && !msg.is_deleted && (
                          <div className="mb-2">
                            {msg.media_type === 'image' ? (
                              <img src={msg.media_url} alt="media"
                                className="max-w-full rounded-xl cursor-pointer hover:opacity-90"
                                onClick={() => window.open(msg.media_url, '_blank')} />
                            ) : msg.media_type === 'video' ? (
                              <video src={msg.media_url} controls className="max-w-full rounded-xl" />
                            ) : msg.media_type === 'audio' ? (
                              <audio src={msg.media_url} controls className="max-w-full w-[220px] sm:w-[240px]" preload="metadata" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-sm underline">
                                <Paperclip size={14} /> View File
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>

                      {/* Reactions row */}
                      {reactionEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reactionEntries.map(([emoji, users]) => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs hover:border-rose-300 transition-colors shadow-sm">
                              {emoji} <span className="text-gray-500">{users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Meta row */}
                      <div className={clsx('flex items-center gap-2 mt-0.5', isMine ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-xs text-gray-400">{(msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : '—')}</span>

                        {/* Hover actions */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          {/* Emoji reaction button */}
                          <div className="relative">
                            <button onClick={() => setEmojiMenu(emojiMenu === msg.id ? null : msg.id)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Add reaction">
                              <Smile size={13} />
                            </button>
                            {emojiMenu === msg.id && (
                              <div className={clsx(
                                'absolute bottom-full mb-1 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-10',
                                'flex flex-wrap gap-1',
                                isMine ? 'right-0' : 'left-0'
                              )} style={{ width: '200px' }}>
                                {REACTION_EMOJIS.map((e) => (
                                  <button key={e} onClick={() => handleReact(msg.id, e)}
                                    className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100">
                                    {e}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Delete own messages */}
                          {isMine && !msg.is_deleted && (
                            <button onClick={() => handleDelete(msg.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {partnerTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold">
              {partner?.full_name?.[0]}
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-100 bg-white">
        {recording ? (
          /* Recording bar */
          <div className="flex items-center gap-3">
            <button onClick={cancelRecording}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
              title="Cancel recording">
              <Trash2 size={18} />
            </button>
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium text-rose-700">Recording…</span>
              <span className="text-sm text-rose-600 tabular-nums ml-auto">{fmtRecordTime(recordSecs)}</span>
            </div>
            <button onClick={stopAndSendRecording} disabled={sending}
              className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-glow transition-all flex-shrink-0"
              title="Send voice note">
              {sending ? <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {/* File attach */}
            <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf,audio/*"
              className="hidden" onChange={() => sendMessage()} />
            <button onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
              title="Attach file">
              <Image size={18} />
            </button>

            {/* Emoji picker for sending */}
            <div className="relative flex-shrink-0">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Insert emoji">
                <Smile size={18} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-20"
                  style={{ width: '240px', maxWidth: 'calc(100vw - 32px)' }}>
                  <div className="flex flex-wrap gap-1">
                    {SEND_EMOJIS.map((e) => (
                      <button key={e} onClick={() => insertEmoji(e)}
                        className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none text-sm transition-all"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />

            {/* Mic (when empty) or Send (when text present) */}
            {text.trim() ? (
              <button onClick={sendMessage} disabled={sending}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-glow transition-all flex-shrink-0">
                {sending ? (
                  <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            ) : (
              <button onClick={startRecording} disabled={sending}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-600 transition-colors flex-shrink-0"
                title="Record voice note">
                <Mic size={18} />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          {recording ? 'Tap send to deliver, or trash to cancel · Max 3 min' : 'Enter to send · Shift+Enter for new line · Mic for voice note'}
        </p>
      </div>
    </div>
  );
}

/* ── Keeu, Taskeeu's friendly chat assistant ─────────────────────── */
export function KeeuAvatar({ size = 34 }) {
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--rose)', boxShadow: '0 0 0 2px #fff, 0 2px 8px rgba(219,39,119,.35)',
      fontSize: size * 0.62, lineHeight: 1,
    }}>👩🏾</span>
  );
}

function KeeuMessage({ msg }) {
  return (
    <div className="flex gap-2 mb-4" data-testid="keeu-message">
      <div className="self-start"><KeeuAvatar /></div>
      <div className="flex flex-col items-start" style={{ maxWidth: '85%' }}>
        <div style={{
          background: '#fff5f7', border: '1px solid #ffd1dc', borderRadius: '4px 18px 18px 18px',
          padding: '10px 14px', boxShadow: '0 2px 10px rgba(168,85,247,.08)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#c41445', marginBottom: 4 }}>
            {msg.bot_name || 'Keeu'} 😊 <span style={{ fontWeight: 600, color: '#ff2d62' }}>· Taskeeu assistant</span>
          </p>
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: '#c41445' }}>{msg.content}</p>
        </div>
        <span className="text-xs text-gray-400 mt-0.5">{msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}</span>
      </div>
    </div>
  );
}
