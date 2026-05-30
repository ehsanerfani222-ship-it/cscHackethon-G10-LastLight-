import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MessageCircle, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import {
  createChatMessage,
  createChatRoom,
  deleteChatMessage,
  deleteChatRoom,
  fetchChatMessages,
  fetchChatRooms,
  updateChatMessage,
  updateChatRoom,
} from '../../services/api';
import type { ChatMessage, ChatRoom } from '../../types/crisis';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ChatPanel() {
  const { username, setUsername, selectedCrisis } = useStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [nameInput, setNameInput] = useState(username);
  const [message, setMessage] = useState('');
  const [editingRoom, setEditingRoom] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  useEffect(() => {
    fetchChatRooms()
      .then((data) => {
        setRooms(data);
        setSelectedRoomId((current) => current || data[0]?.id || '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    fetchChatMessages(selectedRoomId).then(setMessages).catch(() => {});
  }, [selectedRoomId]);

  useEffect(() => {
    if (!selectedRoom) return;
    setRoomName(selectedRoom.name);
    setRoomDescription(selectedRoom.description);
  }, [selectedRoom]);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !username) { toast.error('Enter a room name and username'); return; }
    try {
      const room = await createChatRoom({
        name: roomName,
        description: roomDescription,
        username,
        crisisId: selectedCrisis?.id,
      });
      setRooms([room, ...rooms]);
      setSelectedRoomId(room.id);
      setRoomName('');
      setRoomDescription('');
      setShowCreate(false);
      toast.success('Chat room created');
    } catch { toast.error('Failed to create room'); }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom || !roomName.trim()) return;
    try {
      const updated = await updateChatRoom(selectedRoom.id, { name: roomName, description: roomDescription });
      setRooms(rooms.map((room) => (room.id === updated.id ? updated : room)));
      setEditingRoom(false);
      toast.success('Room updated');
    } catch { toast.error('Failed to update room'); }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom || !window.confirm('Delete this chat room?')) return;
    try {
      await deleteChatRoom(selectedRoom.id);
      const nextRooms = rooms.filter((room) => room.id !== selectedRoom.id);
      setRooms(nextRooms);
      setSelectedRoomId(nextRooms[0]?.id || '');
      toast.success('Room deleted');
    } catch { toast.error('Failed to delete room'); }
  };

  const handleSend = async () => {
    if (!selectedRoomId || !message.trim() || !username) return;
    try {
      const created = await createChatMessage(selectedRoomId, message, username);
      setMessages([...messages, created]);
      setRooms(rooms.map((room) => (
        room.id === selectedRoomId
          ? { ...room, messages: [created], _count: { messages: room._count.messages + 1 }, updatedAt: created.createdAt }
          : room
      )));
      setMessage('');
    } catch { toast.error('Failed to send message'); }
  };

  const startEditMessage = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setMessageDraft(msg.content);
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!messageDraft.trim()) return;
    try {
      const updated = await updateChatMessage(messageId, messageDraft);
      setMessages(messages.map((msg) => (msg.id === messageId ? updated : msg)));
      setEditingMessageId(null);
      setMessageDraft('');
    } catch { toast.error('Failed to update message'); }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteChatMessage(messageId);
      setMessages(messages.filter((msg) => msg.id !== messageId));
      setRooms(rooms.map((room) => (
        room.id === selectedRoomId
          ? { ...room, _count: { messages: Math.max(0, room._count.messages - 1) } }
          : room
      )));
    } catch { toast.error('Failed to delete message'); }
  };

  return (
    <div className="flex h-full" style={{ background: '#050816' }}>
      <div className="w-80 flex flex-col flex-shrink-0" style={{ borderRight: '1px solid rgba(0,229,255,0.1)' }}>
        <div className="px-4 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
          <div className="flex items-center gap-3">
            <MessageCircle size={18} className="text-cyan-400" />
            <div>
              <div className="text-white font-bold text-base">Crisis Chat</div>
              <div className="text-slate-500 text-xs">Room-based coordination</div>
            </div>
          </div>
          <button onClick={() => setShowCreate((v) => !v)}
            className="p-2 rounded-xl text-cyan-400 transition-all"
            style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>
            {showCreate ? <X size={14} /> : <Plus size={14} />}
          </button>
        </div>

        {!username && (
          <div className="mx-4 mt-3 p-3 rounded-xl flex gap-2"
            style={{ background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)' }}>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              placeholder="Set your username"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
            <button onClick={() => setUsername(nameInput.trim())}
              disabled={!nameInput.trim()}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-black"
              style={{ background: '#FFC857' }}>Join</button>
          </div>
        )}

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="mx-4 mt-3 rounded-2xl p-4 space-y-3"
              style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <textarea value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={handleCreateRoom} disabled={!roomName.trim()}
                className="w-full py-2 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
                style={{ background: '#00E5FF' }}>Create Room</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No chat rooms yet.</p>
            </div>
          ) : rooms.map((room) => (
            <button key={room.id} onClick={() => setSelectedRoomId(room.id)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={selectedRoomId === room.id
                ? { background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-white text-sm font-semibold truncate">{room.name}</div>
                <div className="text-xs text-cyan-400">{room._count.messages}</div>
              </div>
              <div className="text-slate-500 text-xs truncate mt-1">{room.description || 'Open coordination room'}</div>
              <div className="text-slate-600 text-xs mt-2">{room.messages[0] ? timeAgo(room.messages[0].createdAt) : 'No messages'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedRoom ? (
          <>
            <div className="px-4 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
              {editingRoom ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 pr-3">
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <input value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="text-white font-bold text-base truncate">{selectedRoom.name}</div>
                  <div className="text-slate-500 text-xs truncate">{selectedRoom.description || 'Open coordination room'}</div>
                </div>
              )}
              {selectedRoom.createdBy === username && (
                <div className="flex gap-1">
                  {editingRoom ? (
                    <button onClick={handleUpdateRoom} className="p-2 rounded-xl text-cyan-400" style={{ background: 'rgba(0,229,255,0.12)' }}>
                      <Check size={14} />
                    </button>
                  ) : (
                    <button onClick={() => setEditingRoom(true)} className="p-2 rounded-xl text-slate-500 hover:text-cyan-400" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Pencil size={14} />
                    </button>
                  )}
                  <button onClick={editingRoom ? () => setEditingRoom(false) : handleDeleteRoom}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {editingRoom ? <X size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {messages.map((msg) => {
                const mine = msg.sender.username === username;
                return (
                  <div key={msg.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && <img src={msg.sender.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-700" />}
                    <div className="max-w-[72%]">
                      <div className={`text-xs mb-1 ${mine ? 'text-right text-cyan-500' : 'text-slate-500'}`}>
                        {msg.sender.username} · {timeAgo(msg.createdAt)}
                      </div>
                      <div className="rounded-2xl px-3 py-2 text-sm"
                        style={mine
                          ? { background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)', color: '#dffbff' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                        {editingMessageId === msg.id ? (
                          <div className="flex gap-2">
                            <input value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateMessage(msg.id)}
                              className="flex-1 bg-transparent text-sm text-white outline-none" />
                            <button onClick={() => handleUpdateMessage(msg.id)} className="text-cyan-400"><Check size={13} /></button>
                            <button onClick={() => setEditingMessageId(null)} className="text-slate-500"><X size={13} /></button>
                          </div>
                        ) : msg.content}
                      </div>
                      {mine && editingMessageId !== msg.id && (
                        <div className="flex justify-end gap-1 mt-1">
                          <button onClick={() => startEditMessage(msg)} className="p-1 text-slate-500 hover:text-cyan-400">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-slate-500 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,229,255,0.1)' }}>
              <input value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={username ? 'Type a message...' : 'Set username to chat'}
                disabled={!username}
                className="flex-1 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 outline-none disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={handleSend} disabled={!message.trim() || !username}
                className="px-4 rounded-xl text-cyan-400 disabled:opacity-40"
                style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Create or select a chat room.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
