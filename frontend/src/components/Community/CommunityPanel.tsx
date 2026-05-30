import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, MessageCircle, AlertTriangle, Share2, Send, X, Pencil, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  fetchPosts,
  toggleReaction,
  updateComment,
  updatePost,
} from '../../services/api';
import type { Comment, Post } from '../../types/crisis';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'discussion', label: '💬 Discussion', color: '#00E5FF' },
  { value: 'help_request', label: '🆘 Help Request', color: '#FF3B5C' },
  { value: 'safety_tip', label: '🛡️ Safety Tip', color: '#2EF2A3' },
  { value: 'report', label: '📡 Report', color: '#FFC857' },
];

const REACTIONS = [
  { type: 'like', emoji: '👍' }, { type: 'heart', emoji: '❤️' },
  { type: 'sos', emoji: '🆘' }, { type: 'strong', emoji: '💪' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PostCard({
  post,
  username,
  onUpdated,
  onDeleted,
}: {
  post: Post;
  username: string;
  onUpdated: (post: Post) => void;
  onDeleted: (postId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [localPost, setLocalPost] = useState(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editType, setEditType] = useState(post.type);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const typeInfo = POST_TYPES.find((t) => t.value === localPost.type) ?? POST_TYPES[0];
  const isOwner = username === localPost.author.username;
  const myReactions = new Set(
    localPost.reactions
      .filter((r) => r.user?.username === username || r.userId === username)
      .map((r) => r.type)
  );

  const handleReact = async (type: string) => {
    if (!username) { toast.error('Set a username first'); return; }
    try {
      await toggleReaction(localPost.id, username, type);
      setLocalPost((p) => {
        const hasIt = p.reactions.some((r) => r.type === type && r.userId === username);
        const reactions = hasIt
          ? p.reactions.filter((r) => !(r.type === type && (r.user?.username === username || r.userId === username)))
          : [...p.reactions, { id: `tmp-${type}`, type, userId: username, user: { username } }];
        return { ...p, reactions };
      });
    } catch { /* ignore */ }
  };

  const handleComment = async () => {
    if (!comment.trim() || !username) return;
    try {
      const c = await addComment(localPost.id, comment, username);
      setLocalPost((p) => ({ ...p, comments: [...p.comments, c], _count: { ...p._count, comments: p._count.comments + 1 } }));
      setComment('');
    } catch { toast.error('Failed to post comment'); }
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updatePost(localPost.id, { content: editContent, type: editType });
      setLocalPost(updated);
      onUpdated(updated);
      setIsEditing(false);
      toast.success('Post updated');
    } catch { toast.error('Failed to update post'); }
    finally { setIsSaving(false); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      await deletePost(localPost.id);
      onDeleted(localPost.id);
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete post'); }
  };

  const startEditComment = (c: Comment) => {
    setEditingCommentId(c.id);
    setCommentDraft(c.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!commentDraft.trim()) return;
    try {
      const updated = await updateComment(commentId, commentDraft);
      setLocalPost((p) => ({
        ...p,
        comments: p.comments.map((c) => (c.id === commentId ? updated : c)),
      }));
      setEditingCommentId(null);
      setCommentDraft('');
    } catch { toast.error('Failed to update comment'); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setLocalPost((p) => ({
        ...p,
        comments: p.comments.filter((c) => c.id !== commentId),
        _count: { ...p._count, comments: Math.max(0, p._count.comments - 1) },
      }));
    } catch { toast.error('Failed to delete comment'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <img src={localPost.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${localPost.author.username}`}
          alt="" className="w-9 h-9 rounded-full bg-slate-700" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{localPost.author.username}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: typeInfo.color, background: `${typeInfo.color}18` }}>
              {typeInfo.label}
            </span>
            {localPost.location && <span className="text-xs text-slate-500">📍 {localPost.location}</span>}
          </div>
          <span className="text-xs text-slate-500">{timeAgo(localPost.createdAt)}</span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {isEditing ? <X size={13} /> : <Pencil size={13} />}
            </button>
            <button onClick={handleDeletePost}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map((t) => (
              <button key={t.value} onClick={() => setEditType(t.value)}
                className="px-3 py-1 rounded-lg text-xs transition-all"
                style={editType === t.value ? { background: `${t.color}20`, border: `1px solid ${t.color}50`, color: t.color }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button onClick={handleUpdatePost} disabled={isSaving || !editContent.trim()}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
            style={{ background: '#00E5FF' }}>
            <Check size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <p className="text-slate-300 text-sm leading-relaxed">{localPost.content}</p>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap">
        {REACTIONS.map((r) => {
          const count = localPost.reactions.filter((rx) => rx.type === r.type).length;
          const active = myReactions.has(r.type);
          return (
            <button
              key={r.type}
              onClick={() => handleReact(r.type)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
              style={active ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
            >
              {r.emoji} {count > 0 && count}
            </button>
          );
        })}
        <button onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MessageCircle size={12} /> {localPost._count.comments}
        </button>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Share2 size={12} /> Share
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {localPost.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.username}`}
                  alt="" className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {editingCommentId === c.id ? (
                    <div className="flex gap-2">
                      <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateComment(c.id)}
                        className="flex-1 bg-transparent text-xs text-white outline-none" />
                      <button onClick={() => handleUpdateComment(c.id)} className="text-cyan-400"><Check size={13} /></button>
                      <button onClick={() => setEditingCommentId(null)} className="text-slate-500"><X size={13} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white text-xs font-semibold">{c.author.username} </span>
                      <span className="text-slate-400 text-xs">{c.content}</span>
                    </>
                  )}
                </div>
                {username === c.author.username && editingCommentId !== c.id && (
                  <div className="flex gap-1">
                    <button onClick={() => startEditComment(c)} className="p-1 text-slate-500 hover:text-cyan-400">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDeleteComment(c.id)} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {username && (
              <div className="flex gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={handleComment} className="p-2 rounded-xl text-cyan-400"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CommunityPanel() {
  const { posts, setPosts, username, setUsername, selectedCrisis } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('discussion');
  const [nameInput, setNameInput] = useState(username);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchPosts().then(setPosts).catch(() => {});
  }, [setPosts]);

  const handlePost = async () => {
    if (!newContent.trim() || !username) { toast.error('Enter content and set a username'); return; }
    setIsPosting(true);
    try {
      const post = await createPost({
        content: newContent, type: newType, username,
        crisisId: selectedCrisis?.id,
        location: selectedCrisis?.location,
      });
      setPosts([post, ...posts]);
      setNewContent('');
      setShowCreate(false);
      toast.success('Posted!');
    } catch { toast.error('Failed to post'); }
    finally { setIsPosting(false); }
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts(posts.map((post) => (post.id === updated.id ? updated : post)));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#050816' }}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
        <div className="flex items-center gap-3">
          <Users size={18} className="text-cyan-400" />
          <div>
            <div className="text-white font-bold text-base">Crisis Community</div>
            <div className="text-slate-500 text-xs">Coordinate, share, survive</div>
          </div>
        </div>
        <button onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Cancel' : 'Post'}
        </button>
      </div>

      {/* Username setup */}
      {!username && (
        <div className="mx-4 mt-3 p-3 rounded-xl flex gap-2"
          style={{ background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)' }}>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            placeholder="Set your username to participate"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
          <button onClick={() => setUsername(nameInput.trim())}
            disabled={!nameInput.trim()}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-black"
            style={{ background: '#FFC857' }}>Join</button>
        </div>
      )}

      {/* Create post */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="mx-4 mt-3 rounded-2xl p-4 space-y-3 flex-shrink-0"
            style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map((t) => (
                <button key={t.value} onClick={() => setNewType(t.value)}
                  className="px-3 py-1 rounded-lg text-xs transition-all"
                  style={newType === t.value ? { background: `${t.color}20`, border: `1px solid ${t.color}50`, color: t.color }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                  {t.label}
                </button>
              ))}
            </div>
            {selectedCrisis && (
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <AlertTriangle size={12} /> Posting about: {selectedCrisis.title}
              </div>
            )}
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share information, request help, or post a safety tip..."
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={handlePost} disabled={isPosting || !newContent.trim()}
              className="w-full py-2 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
              style={{ background: '#00E5FF' }}>
              {isPosting ? 'Posting...' : 'Post to Community'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No posts yet. Be the first to share.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post as Post}
              username={username}
              onUpdated={handlePostUpdated}
              onDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
